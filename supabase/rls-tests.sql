-- ═══════════════════════════════════════════════════════════════════════
--  نادي الجيل الصاعد — RLS security probes  (Phase 2)
--  NOT a migration — do not add this to the migrations/ folder and do not
--  run it against data you care about without reading it first. It is a
--  hand-run checklist for the security review, once the DB is live and
--  0001_init.sql + 0002_seed.sql have both been applied.
--
--  HOW TO RUN
--  Paste into Supabase → SQL Editor (connected as the `postgres` owner
--  role, or any role that may `SET ROLE anon` / `SET ROLE authenticated`)
--  and run block by block, or the whole file at once — every probe is
--  wrapped in its own `begin … rollback`, so:
--   • `set local role …` and `set_config(..., true)` (the JWT-claims GUC
--     `auth.uid()` / `auth.role()` read from) only ever apply inside that
--     one transaction, and
--   • no probe leaves permanent state behind, including the ones that
--     UPDATE a row to test that a trigger reverts it.
--  A plain `rollback` is used throughout (not `commit`) so this file is
--  safe to re-run at any time, in any order, with zero side effects.
--
--  PREREQUISITES for the member-vs-member probes (§4–§6): those need at
--  least one real row in `profiles`, which only `handle_new_user()`
--  creates — i.e. at least one person must have gone through /register.
--  For a completely clean §5 result, use two fresh members (neither
--  promoted to admin/supervisor). §1–§3 need only the seed data.
-- ═══════════════════════════════════════════════════════════════════════


-- ─── §1 — anon: no session at all ───────────────────────────────────────
-- Matches the literal case from the contract: anon carries no JWT, so
-- auth.uid() is NULL and every policy keyed on `id = auth.uid()` excludes
-- every row.
begin;
  set local role anon;
  select auth.uid();                              -- expected: null
  select count(*) from public.profiles;           -- expected: 0  (no anon-read policy on profiles)
rollback;


-- ─── §2 — anon: public reference data IS readable ───────────────────────
-- quran_surahs and program_cycles both carry `for select using (true)`,
-- deliberately open to anon (range-pickers on public pages need this).
begin;
  set local role anon;
  select count(*) from public.quran_surahs;                        -- expected: 114
  select count(*) from public.program_cycles where is_active;      -- expected: 1  («الدورة الأولى», from 0002_seed.sql)
rollback;


-- ─── §3 — anon: read-only — no policy grants anon a write ──────────────
-- quran_surahs/program_cycles have a SELECT policy and nothing else, so
-- even though `grant select on all tables … to anon` is the only anon
-- grant at all (see bottom of 0001_init.sql), an anon INSERT fails at the
-- privilege-check stage (SQLSTATE 42501, permission denied) before RLS is
-- even consulted. Left commented so pasting/running this whole file never
-- aborts partway through — uncomment either line and run it BY ITSELF to
-- observe the error:
--
-- begin;
--   set local role anon;
--   insert into public.quran_surahs (number, name_ar, ayah_count) values (999, 'x', 1);
--   -- expected: ERROR 42501 permission denied for table quran_surahs
-- rollback;
--
-- begin;
--   set local role anon;
--   insert into public.program_cycles (name) values ('غير مصرح');
--   -- expected: ERROR 42501 permission denied for table program_cycles
-- rollback;


-- ─── §4 — member: CAN read their own profile row ────────────────────────
begin;
  set local role authenticated;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub',  (select id::text from public.profiles order by created_at limit 1),
      'role', 'authenticated'
    )::text,
    true
  );
  select count(*) from public.profiles
  where id = (select id from public.profiles order by created_at limit 1);
  -- expected: 1  (profiles_select: `id = auth.uid()`)
rollback;


-- ─── §5 — member: CANNOT read another member's profile row ──────────────
-- "member A" = the first profile row, "member B" = the second. Requires
-- ≥2 signups to be meaningful; with only one profile the inner subquery
-- for B returns null and the outer WHERE never matches anything anyway,
-- which under-tests the policy rather than confirming it — sign up a
-- second member before trusting this result.
begin;
  set local role authenticated;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub',  (select id::text from public.profiles order by created_at limit 1 offset 0),
      'role', 'authenticated'
    )::text,
    true
  );
  select * from public.profiles
  where id = (select id from public.profiles order by created_at limit 1 offset 1);
  -- expected: 0 rows — UNLESS member A happens to be an admin, or a
  -- supervisor of member B's halaqa (profiles_select also allows
  -- is_admin() / supervises(id)). For a clean negative result, use two
  -- plain members who supervise nothing.
rollback;


-- ─── §6 — member: CANNOT escalate their own role/status/membership ─────
-- protect_profile_columns() freezes role, status, in_club and in_hifz
-- back to their old values on every UPDATE where is_admin() is false —
-- it does this silently (no error), so the correct check is "did the
-- value change", not "did the statement fail".
begin;
  set local role authenticated;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub',  (select id::text from public.profiles order by created_at limit 1),
      'role', 'authenticated'
    )::text,
    true
  );

  -- snapshot before
  select role, status, in_club, in_hifz from public.profiles
  where id = (select id from public.profiles order by created_at limit 1);

  update public.profiles
  set role = 'admin', status = 'active', in_club = true, in_hifz = false
  where id = (select id from public.profiles order by created_at limit 1);

  -- snapshot after — expected: IDENTICAL to the "before" row above.
  -- role='member', status='pending' (or whatever it already was) — never
  -- the 'admin'/'active' this statement tried to write.
  select role, status, in_club, in_hifz from public.profiles
  where id = (select id from public.profiles order by created_at limit 1);
rollback;


-- ─── §7 — member: full_name/phone/city/session prefs ARE editable ───────
-- The flip side of §6 — protect_profile_columns() only freezes the four
-- privileged columns; ordinary self-service edits must still work.
begin;
  set local role authenticated;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub',  (select id::text from public.profiles order by created_at limit 1),
      'role', 'authenticated'
    )::text,
    true
  );

  update public.profiles
  set city = 'مدينة تجريبية'
  where id = (select id from public.profiles order by created_at limit 1);

  select city from public.profiles
  where id = (select id from public.profiles order by created_at limit 1);
  -- expected: 'مدينة تجريبية' — the update went through (rolled back after,
  -- so nothing is actually left changed once this block ends)
rollback;


-- ═══════════════════════════════════════════════════════════════════════
--  Operational note — bootstrapping the very first admin
-- ═══════════════════════════════════════════════════════════════════════
-- protect_profile_columns() checks is_admin(), which itself queries
-- `profiles where id = auth.uid() and role = 'admin'`. On a brand-new
-- project nobody is admin yet, so is_admin() is false for EVERYONE,
-- including a direct UPDATE run as the `postgres` owner role with no JWT
-- claims set (auth.uid() is null in that session too) — the trigger will
-- silently revert that first promotion just like §6 above. Triggers fire
-- regardless of role or RLS; there is no user-level way around this by
-- design (self-promotion must be impossible).
--
-- To create the first admin, disable the trigger for one statement as
-- the table owner, then re-enable it immediately:
--
--   alter table public.profiles disable trigger protect_profile_columns;
--   update public.profiles set role = 'admin', status = 'active'
--     where id = '<first-admin-uuid>';
--   alter table public.profiles enable trigger protect_profile_columns;
--
-- Do this once, by hand, outside the app — never automate it.
