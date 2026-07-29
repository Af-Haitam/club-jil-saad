-- ═══════════════════════════════════════════════════════════════════════
-- 0008 — الأسئلة والنقاط
--
-- الفكرة بسيطة: المشرف يطرح سؤالًا باختياراتٍ ويحدّد الصواب، والعضو يجيب
-- مرّةً واحدة، فإن أصاب نال نقطة.
--
-- والصعوبة كلّها في جملةٍ واحدة: **العضو يجب ألّا يقدر على قراءة الجواب
-- الصحيح قبل أن يجيب**. التطبيق يخاطب قاعدة البيانات بمفتاح العضو نفسه لا
-- بمفتاح خادم، فلو كان `is_correct` عمودًا مقروءًا لاستطاع أيّ أحدٍ أن
-- يستعلم عن الجدول مباشرةً ويصيب دائمًا. ولا يكفي أن تُخفيه الواجهة.
--
-- ولذلك:
--   • `question_options` **لا سياسة قراءةٍ فيها للأعضاء بتاتًا** — للطاقم فقط
--   • الأسئلة تصل عبر `get_questions()` وقد نُزع منها الصواب نزعًا
--   • الإجابة تُسجَّل عبر `submit_answer()` وهي التي تحكم ثمّ تكشف
--
-- فالجواب الصحيح لا يغادر الخادم قبل أن يلتزم العضو باختياره. وهذا هو
-- الفرق بين لعبةٍ نزيهة وواجهةٍ تُخفي ما تحته مكشوف.
-- ═══════════════════════════════════════════════════════════════════════

create type public.quiz_status as enum ('draft', 'open', 'closed');

-- ─── السؤال ────────────────────────────────────────────────────────────
create table public.questions (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text,
  -- ما يُعرض بعد الإجابة. النادي دعويّ قبل أن يكون مسابقة: الفائدة في
  -- معرفة **لِمَ** كان هذا الجواب صوابًا، لا في النقطة.
  explanation   text,
  author_id     uuid references public.profiles (id) on delete set null,
  audience_type public.audience_type not null default 'both',
  halaqa_id     uuid references public.halaqat (id) on delete cascade,
  member_id     uuid references public.profiles (id) on delete cascade,
  points        smallint not null default 1 check (points between 1 and 10),
  status        public.quiz_status not null default 'draft',
  published_at  timestamptz,
  closes_at     timestamptz,
  created_at    timestamptz not null default now(),
  constraint q_halaqa_target check (audience_type <> 'halaqa' or halaqa_id is not null),
  constraint q_member_target check (audience_type <> 'member' or member_id is not null)
);

create index questions_open_idx on public.questions (status, published_at desc);

-- ─── الاختيارات ────────────────────────────────────────────────────────
create table public.question_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  body        text not null,
  is_correct  boolean not null default false,
  position    smallint not null check (position between 1 and 6),
  unique (question_id, position)
);

create index question_options_q_idx on public.question_options (question_id);

-- سؤالٌ بلا جوابٍ صحيحٍ واحدٍ بالضبط سؤالٌ مكسور، ولا ينبغي أن يُنشر.
-- الفحص عند النشر لا عند الكتابة، لأنّ المسوّدة تُبنى اختيارًا اختيارًا.
create or replace function public.question_is_sound(p_question uuid)
returns boolean language sql stable set search_path = public as $$
  select count(*) filter (where is_correct) = 1 and count(*) >= 2
    from public.question_options where question_id = p_question;
$$;

-- ─── الإجابات ──────────────────────────────────────────────────────────
create table public.answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  member_id   uuid not null references public.profiles (id) on delete cascade,
  option_id   uuid not null references public.question_options (id) on delete cascade,
  is_correct  boolean not null,
  points      smallint not null default 0,
  answered_at timestamptz not null default now(),
  -- محاولةٌ واحدة. هذا القيد **هو** نزاهة المسابقة، لا الواجهة.
  unique (question_id, member_id)
);

create index answers_member_idx on public.answers (member_id);

-- ═══════════════════════════════════════════════════════════════════════
-- من يَعنيه هذا الخطاب؟ نفس منطق الإعلانات، مكتوبًا مرّةً واحدة.
-- ═══════════════════════════════════════════════════════════════════════
create or replace function public.targets_me(
  p_audience public.audience_type,
  p_halaqa   uuid,
  p_member   uuid
)
returns boolean language sql stable security definer set search_path = public as $$
  select case p_audience
    when 'both'   then auth.uid() is not null
    when 'hifz'   then exists (select 1 from public.profiles p where p.id = auth.uid() and p.in_hifz)
    when 'club'   then exists (select 1 from public.profiles p where p.id = auth.uid() and p.in_club)
    when 'member' then p_member = auth.uid()
    when 'halaqa' then exists (select 1 from public.enrollments e
                               where e.halaqa_id = p_halaqa and e.member_id = auth.uid() and e.active)
    else false
  end;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════
alter table public.questions        enable row level security;
alter table public.question_options enable row level security;
alter table public.answers          enable row level security;

-- السؤال نفسه يُقرأ (نصّه ليس سرًّا)، لكن للمنشور فقط ولمن يعنيه
create policy q_select on public.questions for select
  using (
    public.is_admin()
    or author_id = auth.uid()
    or (status <> 'draft' and public.targets_me(audience_type, halaqa_id, member_id))
  );

-- الكتابة للطاقم، والمشرف محصورٌ في حلقته أو أحد طلابه — نفس الثغرة التي
-- سُدّت في 0005 للإعلانات، تُسدّ هنا من أوّل يوم.
create policy q_write on public.questions for all
  using (public.is_admin() or (public.is_supervisor() and author_id = auth.uid()))
  with check (
    public.is_admin()
    or (
      public.is_supervisor()
      and author_id = auth.uid()
      and (
        (audience_type = 'halaqa' and exists (select 1 from public.halaqat h
              where h.id = halaqa_id and h.supervisor_id = auth.uid()))
        or (audience_type = 'member' and public.supervises(member_id))
      )
    )
  );

-- ‼ الاختيارات: لا قراءة للأعضاء. البتّة. هذا هو قفل الباب.
--   العضو يراها عبر get_questions() منزوعةَ الصواب، ولا سبيل غيره.
create policy opts_staff on public.question_options for all
  using (
    public.is_admin()
    or exists (select 1 from public.questions q
               where q.id = question_id and q.author_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.questions q
               where q.id = question_id and q.author_id = auth.uid())
  );

-- إجابتي أراها، والطاقم يرى إجابات من يشرف عليهم
create policy ans_select on public.answers for select
  using (member_id = auth.uid() or public.is_admin() or public.supervises(member_id));

-- لا سياسة إدراج: الإجابة لا تُكتب إلّا عبر submit_answer().
-- ولو تُركت مفتوحةً لكتب العضو صفًّا بـ is_correct = true بيده.

-- ═══════════════════════════════════════════════════════════════════════
-- ما يصل إلى الجهاز
-- ═══════════════════════════════════════════════════════════════════════

/**
 * الأسئلة التي تخصّ العضو الحالي: المفتوحة التي لم يُجب عنها، ومعها ما
 * أجاب عنه (مكشوفَ الصواب، لأنّه التزم فانتهى الأمر).
 *
 * `is_correct` لا يظهر في المخرجات إلّا بعد وجود إجابة. لا شرطَ في
 * الواجهة يحجبه — الاستعلام نفسه لا يختاره.
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
      'published_at', q.published_at,
      'closes_at',    q.closes_at,
      -- انقضى وقته؟ يُعرض للاطّلاع لا للإجابة
      'expired',      (q.status = 'closed' or (q.closes_at is not null and q.closes_at < now())),
      'answer', case when a.id is null then null else jsonb_build_object(
                  'option_id',  a.option_id,
                  'is_correct', a.is_correct,
                  'points',     a.points
                ) end,
      -- الشرح والصواب لا يخرجان إلّا بعد الإجابة أو بعد الإغلاق
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
 * تسجيل إجابة. هنا يُحكم، وهنا وحده.
 *
 * يرفض: السؤال غير المنشور، والمنتهي، وما لا يعني هذا العضو، والمُجاب
 * عنه سابقًا، والاختيار الذي لا ينتمي إلى السؤال (وإلّا لأرسل العضو
 * معرّف اختيارٍ صحيحٍ من سؤالٍ آخر).
 */
create or replace function public.submit_answer(p_question uuid, p_option uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  q       record;
  correct uuid;
  won     boolean;
  gained  smallint;
begin
  if auth.uid() is null then
    raise exception 'submit_answer: not signed in';
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
  -- الاختيار لا بدّ أن يكون من هذا السؤال بعينه
  if not exists (select 1 from public.question_options
                 where id = p_option and question_id = p_question) then
    raise exception 'submit_answer: option does not belong to this question';
  end if;

  select id into correct from public.question_options
    where question_id = p_question and is_correct limit 1;

  -- سؤالٌ بلا صواب: `won` يصير NULL، وNULL في عمودٍ not null يرفع خطأً
  -- غامضًا يقع على العضو لا على من كتب السؤال. نمسكه هنا بصراحة، ولا
  -- تُحرق محاولة العضو الوحيدة على سؤالٍ مكسور.
  if correct is null then
    raise exception 'submit_answer: question % has no correct option', p_question;
  end if;

  won    := (p_option = correct);
  gained := case when won then q.points else 0 end;

  -- القيد الفريد هو الحكم الأخير لو تسابق طلبان
  insert into public.answers (question_id, member_id, option_id, is_correct, points)
  values (p_question, auth.uid(), p_option, won, gained)
  on conflict (question_id, member_id) do nothing;

  if not found then
    raise exception 'submit_answer: already answered';
  end if;

  return jsonb_build_object(
    'is_correct',  won,
    'points',      gained,
    'correct_id',  correct,
    'explanation', q.explanation
  );
end;
$$;

/**
 * نقاطي — ومركزي بين الجميع.
 *
 * يُحسب الترتيب على **كلّ** الأعضاء لا على العشرة الظاهرين، وإلّا لقال
 * للحادي عشر إنّه بلا مركز.
 */
create or replace function public.my_score()
returns jsonb
language sql stable security definer set search_path = public
as $$
  with totals as (
    select a.member_id, sum(a.points)::int as points,
           count(*)::int as answered,
           count(*) filter (where a.is_correct)::int as correct
    from public.answers a
    join public.profiles p on p.id = a.member_id and p.status = 'active'
    group by a.member_id
  ), ranked as (
    -- `place` لا `position`: الثانية كلمةٌ لها معنًى نحويّ في postgres
    -- (‏`position(x in y)`‎)، ولا داعي لاختبار حدود المُحلّل بلا فائدة.
    select member_id, points, answered, correct,
           rank() over (order by points desc) as place
    from totals
  )
  select coalesce(
    (select jsonb_build_object('points', points, 'answered', answered,
                               'correct', correct, 'position', place)
     from ranked where member_id = auth.uid()),
    jsonb_build_object('points', 0, 'answered', 0, 'correct', 0, 'position', null)
  );
$$;

/**
 * المتصدّرون — عشرة.
 *
 * دالّةٌ مُعرِّفة لأنّ `profiles_select` لا تدع العضو يقرأ اسم غيره، وهذا
 * صحيحٌ ويجب أن يبقى: الاستثناء هنا اسمٌ ونقاط، لا أكثر.
 */
-- تعيد jsonb لا `returns table`: كلمة `position` مسموحةٌ اسمًا لعمودٍ في
-- جدول، لكنّها ممنوعةٌ اسمًا لمُعامل دالّة — و`returns table` يبني
-- مُعاملات. ومفاتيح jsonb نصوصٌ لا معرّفات، فلا تصطدم بكلمةٍ محجوزة أصلًا.
-- وهذا يوافق أخواتها الثلاث: كلّها تعيد jsonb.
create or replace function public.get_leaderboard()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'position',  place,
           'member_id', id,
           'full_name', full_name,
           'points',    points,
           'is_me',     is_me
         ) order by place), '[]'::jsonb)
  from (
    select p.id,
           p.full_name,
           sum(a.points)::int                             as points,
           rank() over (order by sum(a.points) desc)::int as place,
           p.id = auth.uid()                              as is_me
    from public.answers a
    join public.profiles p on p.id = a.member_id and p.status = 'active'
    where auth.uid() is not null
    group by p.id, p.full_name
    order by sum(a.points) desc, p.full_name
    limit 10
  ) top;
$$;

-- الافتراضي في postgres هو منح التنفيذ لـPUBLIC، و«السحب من anon» وحده لا
-- يسحب شيئًا ما دام PUBLIC ممنوحًا. فنسحب من الجميع ثمّ نمنح الداخلين.
--
-- والدوالّ آمنةٌ بذاتها على كلّ حال — كلّها تقرأ `auth.uid()` وتعيد فارغًا
-- للزائر — لكنّ بابين مقفلين خيرٌ من بابٍ واحد.
revoke all on function public.get_questions()           from public;
revoke all on function public.submit_answer(uuid, uuid) from public;
revoke all on function public.my_score()                from public;
revoke all on function public.get_leaderboard()         from public;

grant execute on function public.get_questions()           to authenticated;
grant execute on function public.submit_answer(uuid, uuid) to authenticated;
grant execute on function public.my_score()                to authenticated;
grant execute on function public.get_leaderboard()         to authenticated;
grant execute on function public.targets_me(public.audience_type, uuid, uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- التوزيع — السؤال يصل كما يصل الإعلان
-- ═══════════════════════════════════════════════════════════════════════
alter table public.notifications
  add column if not exists question_id uuid references public.questions (id) on delete cascade;

-- ‼ القيد من 0005 يقبل ثلاث قيمٍ فقط، و'question' ليست منها — فبدونه يفشل
--   التوزيع كلّه عند أوّل سؤال، ورسالة الخطأ لا تدلّ على السبب.
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('announcement', 'reminder', 'system', 'question'));

-- فهرسٌ كامل لا جزئيّ، كإخوته في 0005: الفهرس الجزئي لا يصلح هدفًا
-- لـ on conflict، وNULL لا يساوي NULL فالصفوف القديمة لا تتزاحم.
create unique index if not exists notifications_question_uniq
  on public.notifications (user_id, question_id);

create or replace function public.fanout_notification(p_kind text, p_target uuid)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  src   record;
  admin boolean := public.is_admin();
begin
  if not (admin or public.is_supervisor()) then
    raise exception 'fanout_notification: caller is not staff';
  end if;

  if p_kind = 'announcement' then
    select a.title, a.body, a.image_url, a.audience_type, a.halaqa_id, a.member_id, a.author_id
      into src from public.announcements a where a.id = p_target;
  elsif p_kind = 'reminder' then
    select r.title, r.body, r.image_url, r.audience_type, r.halaqa_id, r.member_id, r.author_id
      into src from public.reminders r where r.id = p_target;
  elsif p_kind = 'question' then
    -- نصّ السؤال هو العنوان؛ والمتن يُترك ليأتي العضو فيقرأه ويجيب
    select q.title, q.body, null::text as image_url, q.audience_type, q.halaqa_id,
           q.member_id, q.author_id
      into src from public.questions q where q.id = p_target;
  else
    raise exception 'fanout_notification: unknown kind %', p_kind;
  end if;

  if not found then
    return;
  end if;

  -- المشرف لا يبثّ للنادي كلّه: حلقته أو أحد طلابه فقط.
  if not admin then
    if src.audience_type = 'halaqa' then
      if not exists (select 1 from public.halaqat h
                     where h.id = src.halaqa_id and h.supervisor_id = auth.uid()) then
        raise exception 'fanout_notification: not your halaqa';
      end if;
    elsif src.audience_type = 'member' then
      if not public.supervises(src.member_id) then
        raise exception 'fanout_notification: not your student';
      end if;
    else
      raise exception 'fanout_notification: audience % not allowed for a supervisor',
                      src.audience_type;
    end if;
  end if;

  return query
  with inserted as (
    insert into public.notifications
      (user_id, kind, announcement_id, reminder_id, question_id, title, body, image_url, url)
    select
      p.id,
      case p_kind when 'reminder' then 'reminder'
                  when 'question' then 'question'
                  else 'announcement' end,
      case when p_kind = 'announcement' then p_target end,
      case when p_kind = 'reminder'     then p_target end,
      case when p_kind = 'question'     then p_target end,
      src.title,
      src.body,
      src.image_url,
      case when p_kind = 'question' then '/dashboard' else '/dashboard/inbox' end
    from public.profiles p
    where p.status = 'active'
      and (src.author_id is null or p.id <> src.author_id)
      and (
        (src.audience_type = 'both')
        or (src.audience_type = 'hifz'   and p.in_hifz)
        or (src.audience_type = 'club'   and p.in_club)
        or (src.audience_type = 'member' and p.id = src.member_id)
        or (src.audience_type = 'halaqa' and exists (
              select 1 from public.enrollments e
              where e.member_id = p.id and e.halaqa_id = src.halaqa_id and e.active))
      )
    on conflict do nothing
    returning user_id
  )
  select inserted.user_id from inserted;
end;
$$;

grant execute on function public.fanout_notification(text, uuid) to authenticated;
