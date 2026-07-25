-- ═══════════════════════════════════════════════════════════════════════
--  0004 — صلاحية الكتابة على الدورات
--
--  program_cycles وُلد بـ RLS مفعّلًا وسياسة قراءة فقط (cycles_read)، فلا
--  أحد — ولا حتى المدير — يستطيع تعديل عدد أسابيع الدورة. هذا الملف يفتح
--  الكتابة للمدير وحده، ليتمكّن من إضافة أسبوع أو حذف الأخير من صفحة الإدارة.
--
--  طبّقه مرّة واحدة في Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════

drop policy if exists cycles_write on public.program_cycles;

create policy cycles_write on public.program_cycles for all
  using (public.is_admin()) with check (public.is_admin());

-- ملاحظة: قيد weekly_sessions.week_number مضبوط على 1..53 منذ 0003،
-- فالدورة تحتمل حتى ٥٣ أسبوعًا بلا تعديل إضافي.
