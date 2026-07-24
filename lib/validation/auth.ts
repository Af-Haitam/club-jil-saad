// تحقّق نماذج الدخول والتسجيل (Zod) — كل رسائل الخطأ عربية من lib/strings.ts فقط.
// هذا الملف أيضًا بيت تعيين أخطاء Supabase على تلك الرسائل، حتى لا يتكرر
// المنطق في كل actions.ts (لا نعرض أبدًا رسالة إنجليزية خام للمستخدم).
import { z } from "zod";
import { strings } from "@/lib/strings";

const a = strings.auth;

/** الشكل المُعاد من كل server action في شاشات الدخول/التسجيل. */
export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  notice?: string;
  ok?: boolean;
};

/** يحوّل ZodError إلى Record<اسم الحقل, أول رسالة عربية> لعرضها تحت كل حقل. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const flat = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const out: Record<string, string> = {};
  for (const key in flat) {
    const messages = flat[key];
    if (messages && messages.length > 0) {
      out[key] = messages[0];
    }
  }
  return out;
}

/**
 * حقل رقم مُختار من قائمة (يوم الاستظهار / مقدار الحفظ).
 * النص الفارغ (لم يُختر بعد) يُرفض *قبل* تحويله لرقم — وإلا فراغ يتحوّل
 * بصمت إلى صفر عبر z.coerce.number()، وقد يكون صفر قيمة صالحة (يوم الأحد).
 */
const chosenNumber = (message: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, message)
    .transform((v) => Number(v))
    .refine((n) => Number.isInteger(n) && n >= min && n <= max, message);

const requiredText = z.string().trim().min(1, a.errRequired);

const emailField = z
  .string()
  .trim()
  .min(1, a.errRequired)
  .pipe(z.string().email(a.errEmail));

// ─── التسجيل ──────────────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    full_name: requiredText,
    phone: requiredText,
    email: emailField,
    password: z.string().min(8, a.errPasswordShort),
    confirm: z.string().min(1, a.errRequired),
    // لا رسالة مخصّصة له في الواجهة (الاختيار افتراضي دائمًا عبر حقل مخفي)؛
    // errGeneric هنا مجرد شبكة أمان لطلب معبوث به يدويًا.
    path: z.enum(["club", "hifz"], a.errGeneric),
    session_day: chosenNumber(a.errChooseDay, 0, 6),
    weekly_amount: chosenNumber(a.errChooseAmount, 1, 8),
  })
  .refine((data) => data.password === data.confirm, {
    message: a.errPasswordMismatch,
    path: ["confirm"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── تعديل الملف الشخصي (المرحلة ٣) ───────────────────────────────────────
export const profileSchema = z.object({
  full_name: requiredText,
  phone: z.string().trim().optional(),
  session_day: chosenNumber(a.errChooseDay, 0, 6),
  weekly_amount: chosenNumber(a.errChooseAmount, 1, 8),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// ─── الدخول ───────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, a.errRequired),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── استعادة كلمة المرور ───────────────────────────────────────────────────
export const forgotSchema = z.object({
  email: emailField,
});

export type ForgotInput = z.infer<typeof forgotSchema>;

// ─── كلمة مرور جديدة ────────────────────────────────────────────────────────
export const resetSchema = z
  .object({
    password: z.string().min(8, a.errPasswordShort),
    confirm: z.string().min(1, a.errRequired),
  })
  .refine((data) => data.password === data.confirm, {
    message: a.errPasswordMismatch,
    path: ["confirm"],
  });

export type ResetInput = z.infer<typeof resetSchema>;

// ─── تعيين أخطاء Supabase Auth على نصوص عربية ثابتة ─────────────────────────
// مبني على الأكواد الحقيقية في @supabase/auth-js (error-codes.ts)، مع مطابقة
// نصّية احتياطية لإصدارات قديمة قد لا ترسل code.
type AuthErrorLike =
  | { code?: string | null; message?: string | null; name?: string | null }
  | null
  | undefined;

const EMAIL_TAKEN_CODES = ["user_already_exists", "email_exists", "identity_already_exists"];
const CREDENTIALS_CODES = ["invalid_credentials"];
const EXPIRED_LINK_CODES = [
  "session_not_found",
  "session_expired",
  "otp_expired",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "flow_state_not_found",
  "flow_state_expired",
  "bad_jwt",
];

export function mapAuthError(error: AuthErrorLike): string {
  if (!error) return a.errGeneric;
  const code = error.code ?? "";
  const message = error.message ?? "";
  const name = error.name ?? "";

  if (EMAIL_TAKEN_CODES.includes(code) || /already registered|already exists/i.test(message)) {
    return a.errEmailTaken;
  }

  if (CREDENTIALS_CODES.includes(code) || /invalid login credentials/i.test(message)) {
    return a.errCredentials;
  }

  if (
    EXPIRED_LINK_CODES.includes(code) ||
    name === "AuthSessionMissingError" ||
    /session|token|expired/i.test(message)
  ) {
    return a.errLinkExpired;
  }

  return a.errGeneric;
}
