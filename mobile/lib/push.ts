// تنبيهات الجهاز — رمز FCM أصيل.
//
// نستعمل getDevicePushTokenAsync لا getExpoPushTokenAsync: الأولى تعيد رمز
// FCM الخام الذي يفهمه خادمنا مباشرةً، والثانية تمرّ بخدمة Expo وتشترط
// حساب EAS ومعرّف مشروع. لا حساب ولا وسيط.
import { useEffect } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";

import { supabase } from "./supabase";

export type PushState = "on" | "off" | "denied" | "unsupported" | "busy" | "failed";

/** التنبيه يظهر ولو كان التطبيق مفتوحًا — وإلّا ضاع إعلانٌ وصل أثناء التصفّح. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** قناة أندرويد — بدونها تصل التنبيهات بأدنى أهمّية فلا تُصدر صوتًا ولا تظهر. */
async function ensureChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "إشعارات النادي",
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: "#C9A227",
    vibrationPattern: [0, 250, 250, 250],
  });
}

/** هل هذا الجهاز مسجَّل **لهذا الحساب**؟ نسأل القاعدة لا الجهاز. */
export async function isRegistered(): Promise<boolean> {
  const token = await currentToken();
  if (!token) return false;
  const { data } = await supabase
    .from("push_tokens")
    .select("id")
    .eq("token", token)
    .limit(1);
  return (data ?? []).length > 0;
}

async function currentToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return null;
    const t = await Notifications.getDevicePushTokenAsync();
    return typeof t.data === "string" ? t.data : null;
  } catch {
    // بناءٌ بلا google-services.json (نسخة التجربة) يرمي هنا — وهذا متوقَّع.
    return null;
  }
}

export async function enablePush(): Promise<PushState> {
  if (!Device.isDevice) return "unsupported";

  try {
    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;

    if (!granted) {
      const asked = await Notifications.requestPermissionsAsync();
      granted = asked.granted;
    }
    if (!granted) return "denied";

    await ensureChannel();

    const token = await Notifications.getDevicePushTokenAsync();
    if (typeof token.data !== "string") return "failed";

    // الانتزاع يجري في القاعدة لا هنا: RLS تمنع الكتابة على صفّ عضوٍ آخر،
    // والدالّة SECURITY DEFINER تقرأ auth.uid() بنفسها فلا يُنتحل أحد.
    const { error } = await supabase.rpc("claim_push_token", {
      p_token: token.data,
      p_platform: Platform.OS === "ios" ? "ios" : "android",
    });
    if (error) return "failed";

    return "on";
  } catch {
    return "failed";
  }
}

export async function disablePush(): Promise<PushState> {
  const token = await currentToken();
  if (!token) return "off";
  await supabase.rpc("release_push_token", { p_token: token });
  return "off";
}

/** يحوّل رابط التنبيه إلى مسارٍ داخل التطبيق. */
function routeFor(data: unknown): string {
  const url = (data as { url?: unknown } | null)?.url;
  if (typeof url !== "string") return "/(tabs)/inbox";
  // الخادم يرسل مسارات الموقع (/dashboard/inbox)، والتطبيق تبويبات.
  if (url.includes("/dashboard/profile")) return "/(tabs)/profile";
  if (url.includes("/dashboard/inbox")) return "/(tabs)/inbox";
  if (url.includes("/dashboard")) return "/(tabs)";
  return "/(tabs)/inbox";
}

/**
 * الضغط على التنبيه يفتح الشاشة المقصودة.
 *
 * حالتان لا واحدة: تنبيهٌ ضُغط والتطبيق يعمل، وتنبيهٌ **أقلع التطبيق منه
 * وهو مغلق** — والثاني لا يمرّ بالمستمع أبدًا، فيُسأل عنه صراحةً عند
 * الإقلاع. إغفاله يعني أنّ الضغط على تنبيهٍ والتطبيق مغلق يفتح الشاشة
 * الأولى لا الإشعار، وهو أكثر الحالات وقوعًا.
 */
export function useNotificationRouting(): void {
  useEffect(() => {
    let handled = false;

    void (async () => {
      const initial = await Notifications.getLastNotificationResponseAsync();
      if (initial && !handled) {
        handled = true;
        // نؤجّل قليلًا حتى يُركَّب المُوجّه، وإلّا ضاع الانتقال.
        setTimeout(() => {
          router.push(routeFor(initial.notification.request.content.data));
        }, 300);
      }
    })();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handled = true;
      router.push(routeFor(response.notification.request.content.data));
    });

    return () => sub.remove();
  }, []);
}

/**
 * الرمز يتبع من دخل.
 *
 * وُجدت الحاجة إليه على جهازٍ حقيقيّ: الرمز كان مسجَّلًا باسم صاحب الجهاز
 * الأوّل، ثمّ دخل حسابٌ آخر فلم ينتقل الرمز — لأنّ `claim_push_token` لا
 * يعمل إلّا عند الضغط على «فعّل التنبيهات». فصار الجهاز:
 *
 *   • لا يستقبل شيئًا للحساب الداخل — وهو أهون الأمرين
 *   • **يستقبل إشعارات الحساب الأوّل الخاصّة** وهو غير مسجَّلٍ به أصلًا
 *
 * والثاني تسريبٌ لا عطل. فيُنتزع الرمز كلّما تغيّر المستخدم، بشرط أن يكون
 * الإذن ممنوحًا سلفًا — لا نسأل أحدًا إذنًا لم يطلبه.
 */
export function usePushOwnership(userId: string | undefined): void {
  useEffect(() => {
    if (!userId) return;
    let alive = true;

    void (async () => {
      const token = await currentToken();
      // لا رمز = لا إذن أو محاكٍ. لا شيء يُنتزع، ولا سؤال يُطرح.
      if (!token || !alive) return;
      await supabase.rpc("claim_push_token", {
        p_token: token,
        p_platform: Platform.OS === "ios" ? "ios" : "android",
      });
    })();

    return () => {
      alive = false;
    };
  }, [userId]);
}

/** يُستدعى قبل تسجيل الخروج، وإلّا بقي الجهاز يستقبل تنبيهات من غادر. */
export async function releaseOnSignOut(): Promise<void> {
  try {
    await disablePush();
  } catch {
    // الخروج لا ينتظر الشبكة — رمزٌ يتيم يُنظَّف عند أوّل إرسالٍ فاشل.
  }
}
