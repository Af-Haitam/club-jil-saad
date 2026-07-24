-- ═══════════════════════════════════════════════════════════════════════
--  نادي الجيل الصاعد — Schema, RLS & triggers  (Phase 2)
--  Paste this whole file into: Supabase → SQL Editor → New query → Run.
--  Run 0002_seed.sql afterwards for the 114 surahs + first cycle.
--
--  Design rules honoured here:
--   • RLS is ENABLED on every table, with policies, from creation.
--   • role (admin|supervisor|member) is separate from membership (in_hifz/in_club).
--   • A new signup is ALWAYS role=member, status=pending — set by trigger,
--     never by the client. Self-promotion to admin is impossible.
--   • in_club = true always implies in_hifz = true (CHECK constraint).
-- ═══════════════════════════════════════════════════════════════════════

-- Arabic-aware, accent/case-insensitive collation for names & search.
-- Wrapped so a Postgres build that rejects this ICU locale can't abort the
-- whole migration — the collation is optional until it's applied per-column
-- (search/sort features, Phase 3+). Everything below runs regardless.
do $$
begin
  create collation if not exists public.ar_ci (
    provider = icu, locale = 'ar-u-ks-level1', deterministic = false
  );
exception when others then
  raise notice 'ar_ci collation skipped (%): Arabic ordering will be applied per-query later', sqlerrm;
end $$;

-- ─── Enumerated types ──────────────────────────────────────────────────
create type public.user_role      as enum ('admin', 'supervisor', 'member');
create type public.user_status    as enum ('pending', 'active', 'suspended');
create type public.session_status as enum ('pending', 'green', 'red', 'absent', 'excused');
create type public.exam_scope     as enum ('member', 'halaqa', 'all');
create type public.exam_status    as enum ('upcoming', 'done', 'cancelled');
create type public.audience_type  as enum ('hifz', 'club', 'both', 'halaqa', 'member');
create type public.push_platform  as enum ('web', 'android', 'ios');

-- ─── profiles ──────────────────────────────────────────────────────────
-- One row per auth user. id mirrors auth.users.id.
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null,
  phone         text,
  city          text,
  email         text,
  role          public.user_role   not null default 'member',
  status        public.user_status not null default 'pending',
  in_hifz       boolean not null default true,
  in_club       boolean not null default false,
  session_day   smallint check (session_day between 0 and 6),   -- 0=الأحد … 6=السبت
  session_time  time,
  weekly_amount smallint check (weekly_amount between 1 and 8),  -- أثمان الحزب (1..8)
  joined_at     timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- club membership implies hifz membership
  constraint club_implies_hifz check (in_hifz or not in_club)
);
create index profiles_role_idx   on public.profiles (role);
create index profiles_status_idx on public.profiles (status);

-- ─── quran_surahs (static reference, seeded in 0002) ───────────────────
create table public.quran_surahs (
  number     smallint primary key check (number between 1 and 114),
  name_ar    text not null,
  ayah_count smallint not null,
  page_start smallint,
  juz        smallint
);

-- ─── program_cycles ────────────────────────────────────────────────────
create table public.program_cycles (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  start_date date,
  week_count smallint not null default 8,          -- 8 أسابيع + الاختبار
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── halaqat ───────────────────────────────────────────────────────────
create table public.halaqat (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  supervisor_id uuid references public.profiles (id) on delete set null,
  schedule_note text,
  capacity      smallint,
  created_at    timestamptz not null default now()
);
create index halaqat_supervisor_idx on public.halaqat (supervisor_id);

-- ─── enrollments (member ↔ halaqa) ─────────────────────────────────────
create table public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.profiles (id) on delete cascade,
  halaqa_id  uuid not null references public.halaqat (id) on delete cascade,
  started_at timestamptz not null default now(),
  active     boolean not null default true,
  unique (member_id, halaqa_id)
);
create index enrollments_member_idx on public.enrollments (member_id);
create index enrollments_halaqa_idx on public.enrollments (halaqa_id);

-- ─── hifz_progress (one row per member) ────────────────────────────────
create table public.hifz_progress (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null unique references public.profiles (id) on delete cascade,
  current_surah   smallint references public.quran_surahs (number),
  current_ayah    smallint,
  memorized_pages smallint,
  memorized_juz   numeric(4,2),
  last_updated_by uuid references public.profiles (id) on delete set null,
  updated_at      timestamptz not null default now()
);

-- ─── weekly_sessions (the colour grid — one seat per member per week) ──
create table public.weekly_sessions (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references public.profiles (id) on delete cascade,
  supervisor_id  uuid references public.profiles (id) on delete set null,
  cycle_id       uuid not null references public.program_cycles (id) on delete cascade,
  week_number    smallint not null check (week_number between 1 and 16),
  week_start     date,
  scheduled_date date,                              -- the member's own day that week
  status         public.session_status not null default 'pending',
  from_surah     smallint references public.quran_surahs (number),
  from_ayah      smallint,
  to_surah       smallint references public.quran_surahs (number),
  to_ayah        smallint,
  hizb_number    smallint,
  mistakes_count smallint,
  notes          text,
  evaluated_by   uuid references public.profiles (id) on delete set null,
  evaluated_at   timestamptz,
  created_at     timestamptz not null default now(),
  unique (member_id, cycle_id, week_number)         -- one seat per week, enforced by the DB
);
create index weekly_sessions_member_idx on public.weekly_sessions (member_id);
create index weekly_sessions_cycle_idx  on public.weekly_sessions (cycle_id);

-- ─── exams ─────────────────────────────────────────────────────────────
create table public.exams (
  id           uuid primary key default gen_random_uuid(),
  scope        public.exam_scope not null,
  member_id    uuid references public.profiles (id) on delete cascade,
  halaqa_id    uuid references public.halaqat (id) on delete cascade,
  title        text not null,
  exam_date    date,
  exam_time    time,
  location     text,
  from_surah   smallint references public.quran_surahs (number),
  from_ayah    smallint,
  to_surah     smallint references public.quran_surahs (number),
  to_ayah      smallint,
  status       public.exam_status not null default 'upcoming',
  result_grade text,
  result_notes text,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  -- scope must carry its target
  constraint exam_member_target check (scope <> 'member' or member_id is not null),
  constraint exam_halaqa_target check (scope <> 'halaqa' or halaqa_id is not null)
);

-- ─── announcements ─────────────────────────────────────────────────────
create table public.announcements (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text,
  image_url     text,
  author_id     uuid references public.profiles (id) on delete set null,
  audience_type public.audience_type not null,
  halaqa_id     uuid references public.halaqat (id) on delete cascade,
  member_id     uuid references public.profiles (id) on delete cascade,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  constraint ann_halaqa_target check (audience_type <> 'halaqa' or halaqa_id is not null),
  constraint ann_member_target check (audience_type <> 'member' or member_id is not null)
);

-- ─── notifications (per-user copy) ─────────────────────────────────────
create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  announcement_id uuid references public.announcements (id) on delete cascade,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id);

-- ─── push_tokens ───────────────────────────────────────────────────────
create table public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  token      text not null unique,
  platform   public.push_platform not null,
  created_at timestamptz not null default now()
);

-- ─── site_sections (Phase 6 CMS — public read) ─────────────────────────
create table public.site_sections (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,
  order_index smallint not null default 0,
  is_visible  boolean not null default true,
  content     jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

-- ─── media_library ─────────────────────────────────────────────────────
create table public.media_library (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  alt_ar      text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════
--  Helper functions (SECURITY DEFINER → bypass RLS, no policy recursion)
-- ═══════════════════════════════════════════════════════════════════════
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_supervisor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'supervisor');
$$;

-- true if the current user supervises a halaqa that `member` is actively enrolled in
create or replace function public.supervises(member uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.enrollments e
    join public.halaqat h on h.id = e.halaqa_id
    where h.supervisor_id = auth.uid()
      and e.member_id = member
      and e.active
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════
--  Triggers
-- ═══════════════════════════════════════════════════════════════════════

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger profiles_updated_at   before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger progress_updated_at   before update on public.hifz_progress
  for each row execute function public.set_updated_at();
create trigger sections_updated_at   before update on public.site_sections
  for each row execute function public.set_updated_at();

-- create the profile row when a user signs up.
-- role & status are HARD-CODED here — never read from client metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, city, in_club,
                               session_day, session_time, weekly_amount)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'عضو جديد'),
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'city', ''),
    coalesce((new.raw_user_meta_data->>'in_club')::boolean, false),
    (new.raw_user_meta_data->>'session_day')::smallint,
    (new.raw_user_meta_data->>'session_time')::time,
    (new.raw_user_meta_data->>'weekly_amount')::smallint
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- freeze privileged columns unless the change comes from an admin, OR from a
-- trusted no-JWT context (postgres in the SQL editor / the service-role key) —
-- which is how the very first admin is bootstrapped. A member editing his own row
-- has auth.uid() set and is not admin, so his role/status/membership stay frozen;
-- anon never reaches here because RLS blocks the UPDATE before the trigger fires.
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role    := old.role;
    new.status  := old.status;
    new.in_club := old.in_club;
    new.in_hifz := old.in_hifz;
  end if;
  return new;
end;
$$;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ═══════════════════════════════════════════════════════════════════════
--  Row Level Security — enable on every table
-- ═══════════════════════════════════════════════════════════════════════
alter table public.profiles        enable row level security;
alter table public.quran_surahs    enable row level security;
alter table public.program_cycles  enable row level security;
alter table public.halaqat         enable row level security;
alter table public.enrollments     enable row level security;
alter table public.hifz_progress   enable row level security;
alter table public.weekly_sessions enable row level security;
alter table public.exams           enable row level security;
alter table public.announcements   enable row level security;
alter table public.notifications   enable row level security;
alter table public.push_tokens     enable row level security;
alter table public.site_sections   enable row level security;
alter table public.media_library   enable row level security;

-- ─── profiles ──────────────────────────────────────────────────────────
-- read: yourself · your students (if supervisor) · everything (if admin)
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin() or public.supervises(id));
-- update: yourself (privileged cols frozen by trigger) · admin anyone
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
-- no INSERT policy: rows are created only by handle_new_user() (definer).
-- no DELETE policy: removed via auth.users cascade.

-- ─── public reference / site content (anyone, incl. anon) ──────────────
create policy surahs_read   on public.quran_surahs   for select using (true);
create policy cycles_read   on public.program_cycles for select using (true);
create policy sections_read on public.site_sections  for select using (is_visible or public.is_admin());
create policy sections_write on public.site_sections for all
  using (public.is_admin()) with check (public.is_admin());

-- ─── halaqat ───────────────────────────────────────────────────────────
create policy halaqat_select on public.halaqat for select
  using (public.is_admin() or supervisor_id = auth.uid()
         or exists (select 1 from public.enrollments e
                    where e.halaqa_id = id and e.member_id = auth.uid() and e.active));
create policy halaqat_write on public.halaqat for all
  using (public.is_admin()) with check (public.is_admin());

-- ─── enrollments ───────────────────────────────────────────────────────
create policy enrollments_select on public.enrollments for select
  using (member_id = auth.uid() or public.is_admin() or public.supervises(member_id));
create policy enrollments_write on public.enrollments for all
  using (public.is_admin()) with check (public.is_admin());

-- ─── hifz_progress ─────────────────────────────────────────────────────
create policy progress_select on public.hifz_progress for select
  using (member_id = auth.uid() or public.is_admin() or public.supervises(member_id));
create policy progress_write on public.hifz_progress for all
  using (public.is_admin() or public.supervises(member_id))
  with check (public.is_admin() or public.supervises(member_id));

-- ─── weekly_sessions ───────────────────────────────────────────────────
create policy sessions_select on public.weekly_sessions for select
  using (member_id = auth.uid() or public.is_admin() or public.supervises(member_id));
create policy sessions_write on public.weekly_sessions for all
  using (public.is_admin() or public.supervises(member_id))
  with check (public.is_admin() or public.supervises(member_id));

-- ─── exams ─────────────────────────────────────────────────────────────
create policy exams_select on public.exams for select
  using (
    public.is_admin()
    or (scope = 'all' and auth.uid() is not null)
    or (scope = 'member' and member_id = auth.uid())
    or (scope = 'halaqa' and exists (
          select 1 from public.enrollments e
          where e.halaqa_id = exams.halaqa_id and e.member_id = auth.uid() and e.active))
    or (halaqa_id is not null and exists (
          select 1 from public.halaqat h
          where h.id = exams.halaqa_id and h.supervisor_id = auth.uid()))
  );
create policy exams_write on public.exams for all
  using (public.is_admin() or public.is_supervisor())
  with check (public.is_admin() or public.is_supervisor());

-- ─── announcements ─────────────────────────────────────────────────────
create policy ann_select on public.announcements for select
  using (
    public.is_admin() or author_id = auth.uid()
    or (audience_type = 'both' and auth.uid() is not null)
    or (audience_type = 'hifz' and exists (select 1 from public.profiles p
          where p.id = auth.uid() and p.in_hifz))
    or (audience_type = 'club' and exists (select 1 from public.profiles p
          where p.id = auth.uid() and p.in_club))
    or (audience_type = 'member' and member_id = auth.uid())
    or (audience_type = 'halaqa' and exists (select 1 from public.enrollments e
          where e.halaqa_id = announcements.halaqa_id and e.member_id = auth.uid() and e.active))
  );
create policy ann_write on public.announcements for all
  using (public.is_admin() or public.is_supervisor())
  with check (public.is_admin() or public.is_supervisor());

-- ─── notifications (strictly your own) ─────────────────────────────────
create policy notif_select on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());
create policy notif_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── push_tokens (strictly your own) ───────────────────────────────────
create policy tokens_all on public.push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── media_library ─────────────────────────────────────────────────────
create policy media_select on public.media_library for select
  using (auth.role() = 'authenticated' or public.is_admin());
create policy media_write on public.media_library for all
  using (public.is_admin()) with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
--  Table privileges — RLS still gates every row on top of these
-- ═══════════════════════════════════════════════════════════════════════
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
-- anon may only ever SELECT, and only rows a using(true) policy exposes
grant select on all tables in schema public to anon;
