import "server-only";

// سجلّ الأخطاء — خادمٌ فقط.
//
// المشكلة التي يحلّها: أعطالُ هذا المشروع كلّها كانت صامتة. المهمّة اليومية
// تفشل في الثالثة صباحًا فلا يعلم أحد؛ والتنبيه يُرفض من FCM فيُقال «دُفع
// إلى ٠ أجهزة» بلا سبب؛ واستعلامٌ مرفوض يعود صفوفًا فارغة تُشبه «لا بيانات».
// كلّها وُجدت بالمصادفة لا بالمراقبة.
//
// ولا يُستعمل هنا `createClient` من `lib/supabase/server`: ذاك يحمل جلسة
// الزائر، وجدول `error_log` بلا سياسة إدراجٍ لأحد — الكتابة بمفتاح الخدمة
// وحده، وهو يتجاوز RLS. ولو فُتح الإدراج للعميل لصار الجدول مصرفًا يملؤه
// أيّ أحدٍ حتى يمتلئ الغيغابايت المجّاني.
import { createClient } from "@supabase/supabase-js";

export type ErrorSource = "cron" | "push" | "action" | "server";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * يسجّل عطلًا. **لا يرمي أبدًا.**
 *
 * تسجيلُ الخطأ لا يجوز أن يكون هو الخطأ: لو فشلت الكتابة (شبكة، مشروعٌ
 * نائم، مفتاحٌ ناقص) ابتُلع الفشل — العملية الأصلية أهمّ من دفترها.
 */
export async function logError(
  source: ErrorSource,
  message: string,
  detail?: unknown,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    const db = admin();
    if (!db) return;
    await db.from("error_log").insert({
      source,
      // العمود `not null`، ورسالةٌ فارغة تُفشل الإدراج فيضيع الخبر كلّه
      message: (message || "(بلا رسالة)").slice(0, 2000),
      detail:
        detail === undefined
          ? null
          : (detail instanceof Error ? (detail.stack ?? detail.message) : String(detail)).slice(
              0,
              8000,
            ),
      meta: meta ?? null,
    });
  } catch {
    // بابٌ مسدود عمدًا.
  }
}

export type ErrorRow = {
  id: string;
  at: string;
  source: string;
  message: string;
  detail: string | null;
  meta: Record<string, unknown> | null;
};

/** آخر ما وقع — تقرؤه لوحة الإدارة. */
export async function recentErrors(limit = 20): Promise<ErrorRow[]> {
  const db = admin();
  if (!db) return [];
  const { data } = await db
    .from("error_log")
    .select("id, at, source, message, detail, meta")
    .order("at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ErrorRow[];
}
