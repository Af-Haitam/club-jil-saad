// تنبيهات الجهاز — رمز FCM أصيل.
//
// نستعمل getDevicePushTokenAsync لا getExpoPushTokenAsync: الأولى تعيد رمز
// FCM الخام الذي يفهمه خادمنا مباشرةً، والثانية تمرّ بخدمة Expo وتشترط
// حساب EAS ومعرّف مشروع. لا حساب ولا وسيط.
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
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

/** يُستدعى قبل تسجيل الخروج، وإلّا بقي الجهاز يستقبل تنبيهات من غادر. */
export async function releaseOnSignOut(): Promise<void> {
  try {
    await disablePush();
  } catch {
    // الخروج لا ينتظر الشبكة — رمزٌ يتيم يُنظَّف عند أوّل إرسالٍ فاشل.
  }
}
