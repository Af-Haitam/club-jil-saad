-- ═══════════════════════════════════════════════════════════════════════
-- 0009 — أكثر من جوابٍ صحيح
--
-- كان السؤال ينتهي بجوابٍ واحد. صار المشرف يعلّم ما شاء من الاختيارات
-- صوابًا، والعضو ينال نقطته إن اختار **مجموعة الصواب كاملةً ولا شيء
-- غيرها** — لا نصف نقطةٍ ولا جزء.
--
-- و`multi_select` عمودٌ صريح لا يُستنتج من عدد الصواب، وهذا هو بيت
-- القصيد: لو استنتجناه لَعرف العضو من شكل الواجهة أنّ الصواب أكثر من
-- واحد قبل أن يجيب، وهذا نصف الجواب. الآن يرى مربّعات اختيارٍ وحسب،
-- ولا يعرف أواحدٌ هو أم ثلاثة.
--
-- طبّقه بعد 0008 في Supabase → SQL Editor → Run.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.questions
  add column if not exists multi_select boolean not null default false;

-- الإجابة صارت مجموعةً. العمود القديم يبقى للصفوف التي سبقت هذه الهجرة،
-- ويُملأ الجديد منها كي لا يضيع ما أُجيب.
alter table public.answers
  add column if not exists option_ids uuid[];

update public.answers
   set option_ids = array[option_id]
 where option_ids is null and option_id is not null;

alter table public.answers
  alter column option_ids set not null,
  alter column option_id drop not null;

-- ═══════════════════════════════════════════════════════════════════════

/**
 * الأسئلة كما يراها العضو — مضافًا إليها `multi_select` وإجابته كمجموعة.
 */
create or replace function public.get_questions()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(x order by x->>'published_at' desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id',           q.id,
      'title',        q.title,
      'body',         q.body,
      'points',       q.points,
      'status',       q.status,
      'multi_select', q.multi_select,
      'published_at', q.published_at,
      'closes_at',    q.closes_at,
      'expired',      (q.status = 'closed' or (q.closes_at is not null and q.closes_at < now())),
      'answer', case when a.id is null then null else jsonb_build_object(
                  'option_ids', to_jsonb(a.option_ids),
                  'is_correct', a.is_correct,
                  'points',     a.points
                ) end,
      'explanation', case
          when a.id is not null
            or q.status = 'closed'
            or (q.closes_at is not null and q.closes_at < now())
          then q.explanation end,
      'options', (
        select jsonb_agg(jsonb_build_object(
                 'id',   o.id,
                 'body', o.body,
                 -- ‼ الصواب يُضمّ فقط متى جاز كشفه
                 'is_correct', case
                     when a.id is not null
                       or q.status = 'closed'
                       or (q.closes_at is not null and q.closes_at < now())
                     then o.is_correct end
               ) order by o.position)
        from public.question_options o where o.question_id = q.id
      )
    ) as x
    from public.questions q
    left join public.answers a
      on a.question_id = q.id and a.member_id = auth.uid()
    where q.status <> 'draft'
      and public.targets_me(q.audience_type, q.halaqa_id, q.member_id)
    order by q.published_at desc
    limit 50
  ) s;
$$;

/**
 * تسجيل إجابة — مجموعةً لا اختيارًا واحدًا.
 *
 * الصواب أن تُساوي المجموعتان تمامًا. ونستعمل `@>` و`<@` معًا لا `=`:
 * المصفوفتان في postgres تتساويان بالترتيب، وترتيب ما ضغطه العضو لا شأن
 * له بصحّة جوابه.
 */
create or replace function public.submit_answer(p_question uuid, p_options uuid[])
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  q        record;
  correct  uuid[];
  picked   uuid[];
  won      boolean;
  gained   smallint;
begin
  if auth.uid() is null then
    raise exception 'submit_answer: not signed in';
  end if;

  -- التكرار في الوارد يفسد المقارنة، ويصل من عميلٍ مكسور أو من عبثٍ متعمّد
  select array(select distinct unnest(p_options)) into picked;
  if array_length(picked, 1) is null then
    raise exception 'submit_answer: no option chosen';
  end if;

  select * into q from public.questions where id = p_question;
  if not found then
    raise exception 'submit_answer: no such question';
  end if;
  if q.status = 'draft' then
    raise exception 'submit_answer: question is not published';
  end if;
  if q.status = 'closed' or (q.closes_at is not null and q.closes_at < now()) then
    raise exception 'submit_answer: question is closed';
  end if;
  if not public.targets_me(q.audience_type, q.halaqa_id, q.member_id) then
    raise exception 'submit_answer: not addressed to you';
  end if;
  if exists (select 1 from public.answers
             where question_id = p_question and member_id = auth.uid()) then
    raise exception 'submit_answer: already answered';
  end if;

  -- كلّ اختيارٍ وارد لا بدّ أن يكون من هذا السؤال بعينه، وإلّا أرسل العضو
  -- معرّف اختيارٍ صحيحٍ من سؤالٍ آخر فنال نقطةً بلا وجه حقّ.
  if exists (
    select 1 from unnest(picked) pid
    where not exists (select 1 from public.question_options o
                      where o.id = pid and o.question_id = p_question)
  ) then
    raise exception 'submit_answer: option does not belong to this question';
  end if;

  -- سؤالٌ بجوابٍ واحد لا يقبل اختيارين، مهما أرسل العميل
  if not q.multi_select and array_length(picked, 1) > 1 then
    raise exception 'submit_answer: this question takes one answer';
  end if;

  select array(select o.id from public.question_options o
               where o.question_id = p_question and o.is_correct)
    into correct;

  if array_length(correct, 1) is null then
    raise exception 'submit_answer: question % has no correct option', p_question;
  end if;

  won    := (picked @> correct and correct @> picked);
  gained := case when won then q.points else 0 end;

  insert into public.answers (question_id, member_id, option_ids, is_correct, points)
  values (p_question, auth.uid(), picked, won, gained)
  on conflict (question_id, member_id) do nothing;

  if not found then
    raise exception 'submit_answer: already answered';
  end if;

  return jsonb_build_object(
    'is_correct',  won,
    'points',      gained,
    'correct_ids', to_jsonb(correct),
    'explanation', q.explanation
  );
end;
$$;

-- التوقيع تغيّر (uuid → uuid[])، فالقديمة تبقى معلَّقةً لو لم تُحذف صراحةً
-- وتُنادى بدلًا من الجديدة حين يُرسل العميل معرّفًا مفردًا.
drop function if exists public.submit_answer(uuid, uuid);

revoke all on function public.submit_answer(uuid, uuid[]) from public;
grant execute on function public.submit_answer(uuid, uuid[]) to authenticated;
revoke all on function public.get_questions() from public;
grant execute on function public.get_questions() to authenticated;

-- سؤالٌ سليم: جوابٌ صحيحٌ واحدٌ على الأقلّ، واختياران فأكثر.
create or replace function public.question_is_sound(p_question uuid)
returns boolean language sql stable set search_path = public as $$
  select count(*) filter (where is_correct) >= 1 and count(*) >= 2
    from public.question_options where question_id = p_question;
$$;
