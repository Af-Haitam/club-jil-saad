-- ═══════════════════════════════════════════════════════════════════════
--  0005 — المرحلة ٧: صندوق الإشعارات + الدفع + حصر صلاحية المشرف
--
--  جدولا notifications و push_tokens موجودان منذ 0001 لكنهما فارغان تمامًا:
--  الإعلان يُنشر، ولا نسخة شخصية لأحد، فلا عدّاد غير مقروء ولا شيء يُدفع
--  إلى الهاتف. هذا الملف يوصلهما بالحياة.
--
--  طبّقه مرّة واحدة في Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1) notifications — نسخة المستخدم تحمل نصّها بنفسها ─────────────────
-- عمود announcement_id وحده لا يكفي: التذكيرات تحتاج صندوقًا أيضًا، ورسائل
-- المهمّة اليومية («اليوم موعد تسميعك») لا مصدر لها في جدول آخر أصلًا.
-- لذلك يُخزَّن العنوان والنصّ هنا مباشرة — قراءة الصندوق تصير استعلامًا واحدًا.
alter table public.notifications
  add column if not exists kind        text not null default 'announcement',
  add column if not exists reminder_id uuid references public.reminders (id) on delete cascade,
  add column if not exists title       text,
  add column if not exists body        text,
  add column if not exists url         text,
  add column if not exists dedupe_key  text;

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('announcement', 'reminder', 'system'));

-- عدّاد غير المقروء: فهرس جزئي يمسّ الصفوف غير المقروءة وحدها.
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where read_at is null;

-- ثلاثة فهارس فريدة = ثلاث ضمانات ضدّ التكرار، وهي ما يجعل on conflict do
-- nothing ذا معنى: إعادة تشغيل المهمّة اليومية أو ضغطة نشر مكرّرة لا تُنتج
-- نسخة ثانية في صندوق أحد.
--
-- بلا شرط `where ... is not null` عمدًا: NULL في postgres لا يساوي NULL، فصفوف
-- المهمّة اليومية (announcement_id فارغ) لا تتزاحم أصلًا. والفهرس الكامل وحده
-- يصلح هدفًا لـ on_conflict عبر PostgREST — الفهرس الجزئي لا تستنتجه.
create unique index if not exists notifications_ann_uniq
  on public.notifications (user_id, announcement_id);
create unique index if not exists notifications_rem_uniq
  on public.notifications (user_id, reminder_id);
create unique index if not exists notifications_dedupe_uniq
  on public.notifications (user_id, dedupe_key);

-- ─── 2) push_tokens — اشتراك Web Push ───────────────────────────────────
-- token يحمل endpoint (فريد أصلًا منذ 0001)، وkeys يحمل زوج p256dh/auth.
alter table public.push_tokens
  add column if not exists keys         jsonb,
  add column if not exists last_used_at timestamptz;

-- ─── 3) fanout_notification — توزيع الرسالة على صناديق المستهدَفين ──────
-- SECURITY DEFINER لأن notifications لا سياسة إدراج لها عمدًا: لا أحد يكتب في
-- صندوق غيره إلّا عبر هذه الدالة، وهي تتحقّق من الصلاحية بنفسها. تُعيد قائمة
-- معرّفات المستقبِلين — منها يعرف الخادم كم شخصًا وصلته الرسالة، وإلى أيّ
-- أجهزة يدفعها.
--
-- شرط الجمهور هنا **نسخة طبق الأصل** من سياسة القراءة ann_select/rem_select.
-- لو اختلفا لظهر لعضوٍ إشعارٌ عن رسالة لا يملك حقّ فتحها.
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
    select a.title, a.body, a.audience_type, a.halaqa_id, a.member_id, a.author_id
      into src from public.announcements a where a.id = p_target;
  elsif p_kind = 'reminder' then
    select r.title, r.body, r.audience_type, r.halaqa_id, r.member_id, r.author_id
      into src from public.reminders r where r.id = p_target;
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
      (user_id, kind, announcement_id, reminder_id, title, body, url)
    select
      p.id,
      case when p_kind = 'reminder' then 'reminder' else 'announcement' end,
      case when p_kind = 'announcement' then p_target end,
      case when p_kind = 'reminder'     then p_target end,
      src.title,
      src.body,
      '/dashboard/inbox'
    from public.profiles p
    where p.status = 'active'
      -- الكاتب لا يُشعر نفسه برسالته
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

-- ─── 4) حصر جمهور المشرف على مستوى قاعدة البيانات ───────────────────────
-- ann_write/rem_write كانتا تتحقّقان من الدور فقط لا من الجمهور، فكان بوسع أيّ
-- مشرف نشر إعلان audience_type = 'both' يصل كلّ أعضاء النادي. الخطة (§54)
-- تنصّ على أن المشرف يخاطب طلابه وحدهم — وهذا ما تفرضه السياستان الآن.
drop policy if exists ann_write on public.announcements;
create policy ann_write on public.announcements for all
  using (
    public.is_admin()
    or (public.is_supervisor() and author_id = auth.uid())
  )
  with check (
    public.is_admin()
    or (
      public.is_supervisor()
      and author_id = auth.uid()
      and (
        (audience_type = 'halaqa' and exists (
           select 1 from public.halaqat h
           where h.id = announcements.halaqa_id and h.supervisor_id = auth.uid()))
        or (audience_type = 'member' and public.supervises(announcements.member_id))
      )
    )
  );

drop policy if exists rem_write on public.reminders;
create policy rem_write on public.reminders for all
  using (
    public.is_admin()
    or (public.is_supervisor() and author_id = auth.uid())
  )
  with check (
    public.is_admin()
    or (
      public.is_supervisor()
      and author_id = auth.uid()
      and (
        (audience_type = 'halaqa' and exists (
           select 1 from public.halaqat h
           where h.id = reminders.halaqa_id and h.supervisor_id = auth.uid()))
        or (audience_type = 'member' and public.supervises(reminders.member_id))
      )
    )
  );

-- ملاحظة: القراءة لم تتغيّر — ann_select/rem_select سياستان مستقلّتان،
-- والسياسات المتساهلة تُجمع بـ OR، فالمشرف ما زال يقرأ ما كان يقرأ.
