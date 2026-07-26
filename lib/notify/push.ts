// إرسال تنبيهات Web Push — خادم فقط.
//
// Web Push مجاني بالكامل ولا يمرّ بوسيط: المتصفح يعطي العضو رابط اشتراك
// (endpoint) عند خادم الدفع الخاص به — Google أو Mozilla أو Apple — ونحن
// نُوقّع الرسالة بمفتاح VAPID ونرسلها إليه مباشرة. لا حساب ولا بطاقة.
import webpush, { type PushSubscription, WebPushError } from "web-push";

import { createAdminClient } from "@/lib/supabase/admin";

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

// حدّ حمولة Web Push نحو ٤ كيلوبايت، والنصّ الطويل لا يُعرض كاملًا في
// الإشعار على أيّ حال — فالقصّ هنا حماية لا تجميل.
const MAX_BODY = 180;

let ready: boolean | null = null;

/** true إذا كانت مفاتيح VAPID مضبوطة. بدونها يصمت الدفع بدل أن ينهار. */
export function isPushConfigured(): boolean {
  if (ready !== null) return ready;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    ready = false;
    return false;
  }

  // VAPID يشترط mailto: أو https: — وعنوان التطوير http://localhost يرفضه،
  // فنسقط إلى عنوان الموقع العلني حين لا يصلح ما في البيئة.
  const raw = process.env.VAPID_SUBJECT ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const subject =
    raw.startsWith("mailto:") || raw.startsWith("https://")
      ? raw
      : "https://club-jil-saad.vercel.app";

  webpush.setVapidDetails(subject, publicKey, privateKey);
  ready = true;
  return true;
}

interface TokenRow {
  id: string;
  token: string;
  keys: { p256dh: string; auth: string } | null;
}

export interface PushOutcome {
  sent: number;
  pruned: number;
}

/**
 * يدفع الرسالة إلى كل أجهزة المستخدمين المذكورين.
 * لا يرمي أبدًا: فشل التنبيه لا يجوز أن يُفشل نشر الإعلان نفسه.
 */
export async function pushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<PushOutcome> {
  if (userIds.length === 0 || !isPushConfigured()) return { sent: 0, pruned: 0 };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("push_tokens")
      .select("id, token, keys")
      .in("user_id", userIds);

    if (error || !data || data.length === 0) return { sent: 0, pruned: 0 };

    const rows = (data as TokenRow[]).filter((r) => r.keys?.p256dh && r.keys?.auth);
    const message = JSON.stringify({
      title: payload.title,
      body: payload.body.slice(0, MAX_BODY),
      url: payload.url,
    });

    const results = await Promise.allSettled(
      rows.map((row) => {
        const subscription: PushSubscription = {
          endpoint: row.token,
          keys: { p256dh: row.keys!.p256dh, auth: row.keys!.auth },
        };
        return webpush.sendNotification(subscription, message, { TTL: 12 * 60 * 60 });
      }),
    );

    const deadIds: string[] = [];
    const liveIds: string[] = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        liveIds.push(rows[i].id);
        return;
      }
      // 404/410 = الاشتراك انتهى (المتصفح أُلغي تثبيته أو مُسحت بياناته).
      // أيّ خطأ آخر قد يكون عابرًا، فلا نحذف على أساسه.
      const status = (result.reason as WebPushError)?.statusCode;
      if (status === 404 || status === 410) deadIds.push(rows[i].id);
    });

    if (deadIds.length > 0) {
      await supabase.from("push_tokens").delete().in("id", deadIds);
    }
    if (liveIds.length > 0) {
      await supabase
        .from("push_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .in("id", liveIds);
    }

    return { sent: liveIds.length, pruned: deadIds.length };
  } catch {
    return { sent: 0, pruned: 0 };
  }
}
