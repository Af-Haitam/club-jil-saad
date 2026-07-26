"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * تعليم كل إشعارات العضو كمقروءة.
 *
 * لا تُعلَّم تلقائيًا عند فتح الصندوق عمدًا: العدّاد الذي يختفي من تلقائه
 * يُخفي معه ما لم يُقرأ فعلًا. الضغط قرارٌ من العضو، ونتيجته واضحة.
 *
 * السياسة notif_update تحصر التحديث في `user_id = auth.uid()`، فشرط eq
 * أدناه توثيق للنية لا حاجز أمني — الحاجز في قاعدة البيانات.
 */
export async function markAllRead(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  // "layout" لا "page": عدّاد الجرس يعيش في قوقعة /dashboard، ولو أبطلنا
  // الصفحة وحدها لبقي الرقم القديم معلّقًا في الترويسة.
  revalidatePath("/dashboard", "layout");
}

// ─── اشتراك الدفع على هذا الجهاز ────────────────────────────────────────

export interface BrowserSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * حفظ اشتراك المتصفح. سياسة tokens_all تحصر الصفوف في صاحبها، فلا يستطيع
 * عضو تسجيل جهاز باسم غيره ولا قراءة أجهزته.
 */
export async function saveSubscription(sub: BrowserSubscription): Promise<{ ok: boolean }> {
  // المدخل يأتي من المتصفح، فيُفحص شكله قبل أن يمسّ قاعدة البيانات.
  if (typeof sub?.endpoint !== "string" || !sub.endpoint.startsWith("https://")) {
    return { ok: false };
  }
  if (typeof sub.keys?.p256dh !== "string" || typeof sub.keys?.auth !== "string") {
    return { ok: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: user.id,
      token: sub.endpoint,
      platform: "web",
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    },
    { onConflict: "token" },
  );

  return { ok: !error };
}

export async function removeSubscription(endpoint: string): Promise<{ ok: boolean }> {
  if (typeof endpoint !== "string" || endpoint.length === 0) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("push_tokens")
    .delete()
    .eq("token", endpoint)
    .eq("user_id", user.id);

  return { ok: !error };
}
