// توزيع رسالة منشورة على صناديق المستهدَفين — خادم فقط.
//
// جدول notifications بلا سياسة إدراج عمدًا: لا أحد يكتب في صندوق غيره. الكتابة
// الوحيدة تمرّ عبر دالة fanout_notification (SECURITY DEFINER، ملف الترحيل 0005)
// وهي تتحقّق من الدور والجمهور داخل قاعدة البيانات نفسها.
import type { SupabaseClient } from "@supabase/supabase-js";

export type FanoutKind = "announcement" | "reminder";

export interface FanoutResult {
  recipients: string[];
  error: string | null;
}

export async function fanout(
  supabase: SupabaseClient,
  kind: FanoutKind,
  targetId: string,
): Promise<FanoutResult> {
  const { data, error } = await supabase.rpc("fanout_notification", {
    p_kind: kind,
    p_target: targetId,
  });

  if (error) return { recipients: [], error: error.message };

  // الدالة تُعيد setof uuid. تُرجعها PostgREST مصفوفةَ نصوص، لكنّ بعض
  // الإصدارات تغلّف كل صف في كائن باسم الدالة — نقبل الشكلين.
  const rows: unknown[] = Array.isArray(data) ? data : [];
  const recipients = rows
    .map((row) =>
      typeof row === "string"
        ? row
        : ((row as Record<string, unknown> | null)?.fanout_notification as string | undefined),
    )
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  return { recipients, error: null };
}
