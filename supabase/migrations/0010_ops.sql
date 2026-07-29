-- ═══════════════════════════════════════════════════════════════════════
-- 0010 — التشغيل: سجلّ الأخطاء ونسخة احتياطية أسبوعية
--
-- المرحلة ٩. بندان يشتركان في هذا الملفّ لأنّهما وجهان لسؤالٍ واحد:
-- **كيف نعرف أنّ شيئًا انكسر، وكيف نستردّ إن انكسر؟**
--
-- اليوم لا نعرف. المهمّة اليومية تفشل في الثالثة صباحًا فلا يقول أحدٌ
-- شيئًا؛ والتنبيه لا يصل فيُظنّ أنّ العضو لم يُفعّله. والنسخ الاحتياطي في
-- خطّة Supabase المجّانية غير موجود أصلًا — فإن مُسح صفٌّ ذهب.
--
-- طبّقه في Supabase → SQL Editor → Run.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── ١) سجلّ الأخطاء ────────────────────────────────────────────────────
create table if not exists public.error_log (
  id         uuid primary key default gen_random_uuid(),
  at         timestamptz not null default now(),
  -- من أين: 'cron' · 'push' · 'action' · 'server'
  source     text not null,
  message    text not null,
  detail     text,
  user_id    uuid references public.profiles (id) on delete set null,
  meta       jsonb
);

create index if not exists error_log_at_idx on public.error_log (at desc);

alter table public.error_log enable row level security;

-- المدير يقرأ. ولا سياسة كتابةٍ لأحد بتاتًا:
-- الكتابة تجري بمفتاح الخدمة من الخادم وحده، وهو يتجاوز RLS. ولو فُتح
-- الإدراج للعميل لصار الجدول مصرفًا مفتوحًا يملؤه أيّ أحدٍ حتى يمتلئ
-- الغيغابايت المجّاني ويتوقّف كلّ شيء.
drop policy if exists errlog_read on public.error_log;
create policy errlog_read on public.error_log for select using (public.is_admin());

-- ─── ٢) دلو النسخ الاحتياطي ─────────────────────────────────────────────
-- **غير عامّ.** يحمل أسماء الأعضاء وهواتفهم وتقدّمهم — ولا سياسة تُكتب له،
-- فلا يقرؤه إلّا مفتاح الخدمة. وهذا هو الفرق بينه وبين مستودع git: المستودع
-- علنيّ، وهذه بيانات أشخاص.
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;

-- ─── ٣) لقطة البيانات ───────────────────────────────────────────────────
/**
 * كلّ ما يلزم لإعادة بناء النادي، في كائنٍ واحد.
 *
 * لماذا دالّة لا استعلاماتٌ من الخادم؟ لأنّ اللقطة تُؤخذ في معاملةٍ واحدة،
 * فلا تلتقط عضوًا أُضيف بين جدولٍ وجدول ولا حصّةً حُذفت في أثناء النسخ.
 *
 * ولا تُدرَج `auth.users` — لا تملكها هذه الدالّة ولا ينبغي. استرجاعُ
 * الحسابات شأن Supabase، وما هنا هو بيانات النادي التي لا مصدر لها سواه.
 */
create or replace function public.export_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'taken_at',        now(),
    'profiles',        (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.profiles t),
    'halaqat',         (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.halaqat t),
    'enrollments',     (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.enrollments t),
    'program_cycles',  (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.program_cycles t),
    'weekly_sessions', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.weekly_sessions t),
    'hifz_progress',   (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.hifz_progress t),
    'exams',           (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.exams t),
    'announcements',   (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.announcements t),
    'reminders',       (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.reminders t),
    'questions',       (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.questions t),
    'question_options',(select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.question_options t),
    'answers',         (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.answers t),
    'site_sections',   (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.site_sections t)
  );
$$;

-- الدالّة تقرأ كلّ صفٍّ في النادي متجاوزةً RLS — فلا تُمنح لأحد.
-- مفتاح الخدمة وحده يناديها، وهو لا يحتاج منحًا.
revoke all on function public.export_snapshot() from public;
