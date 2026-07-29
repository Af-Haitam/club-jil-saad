-- ═══════════════════════════════════════════════════════════════════════
-- 0011 — ثغرة: `export_snapshot()` كانت مفتوحةً للجميع  ‼ عاجل
--
-- ما وقع: أيّ أحدٍ يحمل المفتاح العلنيّ — وهو مخبوزٌ في كلّ صفحةٍ من
-- الموقع وفي حزمة أندرويد، أي **أيّ أحدٍ فعلًا** — كان يستطيع أن ينادي
-- `export_snapshot()` فيعود إليه:
--
--   • أسماء الأعضاء كاملةً، وهواتفهم، وبُرُدهم، ومدنهم
--   • كلّ حصص الاستظهار، وكلّ تقدّم الحفظ
--
-- بلا تسجيل دخول. اختُبر بالمفتاح العلنيّ فعلًا، لا استُنتج.
--
-- ═══ لماذا لم تنفع `revoke ... from public`؟ ═══
--
-- لأنّ Supabase تضبط `alter default privileges` فتمنح `anon` و
-- `authenticated` تنفيذَ كلّ دالّةٍ جديدة في `public` **منحًا صريحًا
-- باسم الدور**. و`revoke from public` تسحب منحة PUBLIC العامّة ولا تمسّ
-- المنحتين الصريحتين — فتبقى الدالّة مفتوحة.
--
-- وهذا هو خطأ 0008 نفسه معكوسًا: هناك كتبتُ أنّ «السحب من anon وحده لا
-- يكفي ما دام PUBLIC ممنوحًا»، ثمّ وقعتُ في الوجه الآخر هنا.
--
-- ═══ ولماذا كانت هذه الدالّة وحدها خطِرة؟ ═══
--
-- لأنّ أخواتها (`get_questions` و`get_leaderboard` و`my_score`) تقرأ
-- `auth.uid()` بنفسها فتعود فارغةً للزائر مهما كانت المنح — فهي محميّةٌ
-- ببنيتها. أمّا هذه فلا شرط فيها البتّة: كانت المنحة هي الحارس الوحيد.
--
-- **الدالّة المُعرِّفة تتجاوز RLS، فالمنح هو كلّ حمايتها.** ولذلك يُقفل
-- هنا بابان لا باب: منحٌ مضبوط، وشرطٌ داخل الدالّة.
--
-- طبّقه فورًا في Supabase → SQL Editor → Run.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── القفل الأوّل: سحب التنفيذ من كلّ دورٍ يصل من الشبكة ────────────────
revoke all on function public.export_snapshot() from public;
revoke all on function public.export_snapshot() from anon;
revoke all on function public.export_snapshot() from authenticated;

-- ─── القفل الثاني: شرطٌ داخل الدالّة ────────────────────────────────────
/**
 * لقطة كاملة — لمفتاح الخدمة وحده.
 *
 * الشرط هنا ليس تكرارًا للمنح: المنح يمكن أن ينساه ملفُّ ترحيلٍ قادم أو
 * تُعيده `alter default privileges` عند إعادة إنشاء الدالّة. أمّا الشرط
 * فيسافر مع الدالّة نفسها ولا يُفقد.
 *
 * و`auth.role()` تعيد 'service_role' حين يُنادى بمفتاح الخدمة، و'anon' أو
 * 'authenticated' لمن جاء من متصفّحٍ أو هاتف.
 */
create or replace function public.export_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  caller text := coalesce(auth.role(), '');
begin
  if caller <> 'service_role' then
    raise exception 'export_snapshot: service role only (got %)', caller
      using errcode = 'insufficient_privilege';
  end if;

  return jsonb_build_object(
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
end;
$$;

-- إعادة الإنشاء تُعيد منحة PUBLIC الافتراضية، فيُسحب بعدها لا قبلها.
revoke all on function public.export_snapshot() from public;
revoke all on function public.export_snapshot() from anon;
revoke all on function public.export_snapshot() from authenticated;
