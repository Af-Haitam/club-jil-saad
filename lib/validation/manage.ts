// تحقّق نماذج الإدارة (المرحلة ٤) — كل الرسائل عربية.
import { z } from "zod";

const reqNum = (msg: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, msg)
    .transform((v) => Number(v))
    .refine((n) => Number.isInteger(n) && n >= min && n <= max, msg);

const optNum = (min: number, max: number, msg = "قيمة غير صحيحة") =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((n) => n === null || (Number.isInteger(n) && n >= min && n <= max), msg);

// يتحمّل غياب الحقل (undefined) — مهم للحقول الشرطية (هدف الاختبار مثلًا).
const optText = z.preprocess(
  (v) => (v == null || v === "" ? null : String(v).trim()),
  z.string().nullable()
);

// ─── تسجيل الاستظهار ───────────────────────────────────────────────────
export const recordSchema = z.object({
  member_id: z.string().min(1, "اختر عضوًا"),
  week_number: reqNum("اختر الأسبوع", 1, 53),
  status: z.enum(["green", "red", "absent", "excused"], "اختر التقييم"),
  from_surah: optNum(1, 114),
  from_ayah: optNum(1, 300),
  to_surah: optNum(1, 114),
  to_ayah: optNum(1, 300),
  hizb_number: optNum(1, 60),
  mistakes_count: optNum(0, 999),
  notes: optText,
});

// ─── إنشاء حلقة ────────────────────────────────────────────────────────
export const halaqaSchema = z.object({
  name: z.string().trim().min(1, "أدخل اسم الحلقة"),
  supervisor_id: optText,
  schedule_note: optText,
  capacity: optNum(1, 200),
});

// ─── إنشاء اختبار ──────────────────────────────────────────────────────
export const examSchema = z.object({
  title: z.string().trim().min(1, "أدخل عنوان الاختبار"),
  scope: z.enum(["all", "halaqa", "member"], "اختر النطاق"),
  halaqa_id: optText,
  member_id: optText,
  exam_date: optText,
  exam_time: optText,
  location: optText,
  from_surah: optNum(1, 114),
  from_ayah: optNum(1, 300),
  to_surah: optNum(1, 114),
  to_ayah: optNum(1, 300),
});

// خانة اختيار: المتصفّح لا يرسل الحقل أصلًا حين تكون غير مؤشَّرة، فالغياب = false.
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

// عدد عشري اختياري (الأجزاء المحفوظة numeric(4,2)).
const optFloat = (min: number, max: number, msg = "قيمة غير صحيحة") =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((n) => n === null || (Number.isFinite(n) && n >= min && n <= max), msg);

// ─── تعديل عضو (المرحلة ٥) — الدور والحالة والعضوية والحلقة والتقدم معًا ──
export const memberSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["admin", "supervisor", "member"], "اختر الدور"),
  status: z.enum(["pending", "active", "suspended"], "اختر الحالة"),
  in_hifz: checkbox,
  in_club: checkbox,
  session_day: optNum(0, 6, "اختر يومًا صحيحًا"),
  session_time: optText,
  weekly_amount: optNum(1, 8),
  halaqa_id: optText,
  current_surah: optNum(1, 114),
  current_ayah: optNum(1, 300),
  memorized_pages: optNum(0, 604),
  memorized_juz: optFloat(0, 30),
});

// ─── تعديل حلقة قائمة ──────────────────────────────────────────────────
export const halaqaEditSchema = halaqaSchema.extend({ id: z.string().min(1) });

// ─── نشر إعلان/تذكير ───────────────────────────────────────────────────
export const contentSchema = z.object({
  title: z.string().trim().min(1, "أدخل العنوان"),
  body: optText,
  image_url: optText,
  audience_type: z.enum(["both", "hifz", "club"], "اختر الجمهور"),
});
