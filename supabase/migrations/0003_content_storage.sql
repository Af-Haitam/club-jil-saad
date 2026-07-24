-- ═══════════════════════════════════════════════════════════════════════
--  نادي الجيل الصاعد — المرحلة ٤: التذكيرات + تخزين الصور + مرونة طول الدورة
--  الصق هذا الملف في: Supabase → SQL Editor → New query → Run (مرة واحدة).
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1) طول الدورة مرن — رفع سقف رقم الأسبوع من 16 إلى 53 ───────────────
alter table public.weekly_sessions drop constraint if exists weekly_sessions_week_number_check;
alter table public.weekly_sessions
  add constraint weekly_sessions_week_number_check check (week_number between 1 and 53);

-- ─── 2) reminders — تذكيرات (مجرى مستقل عن الإعلانات، بصورة اختيارية) ───
create table if not exists public.reminders (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text,
  image_url     text,
  author_id     uuid references public.profiles (id) on delete set null,
  audience_type public.audience_type not null default 'both',
  halaqa_id     uuid references public.halaqat (id) on delete cascade,
  member_id     uuid references public.profiles (id) on delete cascade,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  constraint rem_halaqa_target check (audience_type <> 'halaqa' or halaqa_id is not null),
  constraint rem_member_target check (audience_type <> 'member' or member_id is not null)
);
create index if not exists reminders_published_idx on public.reminders (published_at desc);

alter table public.reminders enable row level security;

-- قراءة التذكير حسب الجمهور — نفس منطق الإعلانات
create policy rem_select on public.reminders for select
  using (
    public.is_admin() or author_id = auth.uid()
    or (audience_type = 'both' and auth.uid() is not null)
    or (audience_type = 'hifz' and exists (select 1 from public.profiles p
          where p.id = auth.uid() and p.in_hifz))
    or (audience_type = 'club' and exists (select 1 from public.profiles p
          where p.id = auth.uid() and p.in_club))
    or (audience_type = 'member' and member_id = auth.uid())
    or (audience_type = 'halaqa' and exists (select 1 from public.enrollments e
          where e.halaqa_id = reminders.halaqa_id and e.member_id = auth.uid() and e.active))
  );
create policy rem_write on public.reminders for all
  using (public.is_admin() or public.is_supervisor())
  with check (public.is_admin() or public.is_supervisor());

grant select, insert, update, delete on public.reminders to authenticated;
grant select on public.reminders to anon;

-- ─── 3) تخزين الصور — دلو media عام القراءة، والرفع للمدير/المشرف فقط ───
insert into storage.buckets (id, name, public)
  values ('media', 'media', true)
  on conflict (id) do nothing;

-- القراءة عامة (الدلو public)، الكتابة للطاقم فقط.
create policy "media public read" on storage.objects for select
  using (bucket_id = 'media');
create policy "media staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (public.is_admin() or public.is_supervisor()));
create policy "media staff update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (public.is_admin() or public.is_supervisor()));
create policy "media staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (public.is_admin() or public.is_supervisor()));
