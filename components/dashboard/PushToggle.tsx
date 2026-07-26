"use client";

// تفعيل تنبيهات الجهاز. المكوّن الوحيد في المرحلة ٧ الذي يحتاج جافاسكريبت
// في المتصفح فعلًا: الاشتراك في الدفع لا يتمّ إلّا من المتصفح نفسه.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  saveSubscription,
  removeSubscription,
  isMySubscription,
} from "@/app/dashboard/inbox/actions";
import { strings } from "@/lib/strings";

type State = "checking" | "unsupported" | "off" | "on" | "busy" | "denied" | "failed";

// مفتاح VAPID يصل نصًّا بترميز base64url، وpushManager يريد بايتات.
// نبني المصفوفة فوق ArrayBuffer صريح: النوع الافتراضي ArrayBufferLike يشمل
// SharedArrayBuffer الذي لا يقبله BufferSource.
function urlBase64ToUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

// آيفون لا يسمح بالتنبيهات من سفاري مباشرة — فقط بعد «إضافة إلى الشاشة
// الرئيسية». نكشف الحالة لنشرحها بدل أن يضغط العضو زرًّا لا يعمل.
function isIosBrowserNotInstalled(): boolean {
  if (typeof navigator === "undefined") return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!ios) return false;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return !standalone;
}

export default function PushToggle({ vapidPublicKey }: { vapidPublicKey: string }) {
  // الحالتان في كائن واحد يُضبط دفعةً واحدة: الفحص كلّه يُحسم قبل أوّل رسم،
  // فلا سلسلة إعادات رسم ولا وميض بين «غير مدعوم» و«يحتاج تثبيتًا».
  const [{ state, needsInstall }, setStatus] = useState<{
    state: State;
    needsInstall: boolean;
  }>({ state: "checking", needsInstall: false });
  const d = strings.dashboard;

  useEffect(() => {
    let cancelled = false;

    const detect = async (): Promise<{ state: State; needsInstall: boolean }> => {
      // تُحسب دائمًا: النصيحة صحيحة على الآيفون غير المثبَّت مهما كانت
      // نتيجة فحص الدعم.
      const needsInstall = isIosBrowserNotInstalled();

      const supported =
        "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) return { state: "unsupported", needsInstall };
      if (Notification.permission === "denied") return { state: "denied", needsInstall };

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        if (!existing) return { state: "off", needsInstall };

        // وجود اشتراك في المتصفح لا يعني أنه اشتراكي: الاشتراك يخصّ الجهاز
        // لا الحساب. نسأل الخادم إن كان مسجّلًا باسمي، وإلّا فالزرّ «مطفأ»
        // وضغطُه ينتزع الجهاز باسمي.
        const mine = await isMySubscription(existing.endpoint);
        return { state: mine ? "on" : "off", needsInstall };
      } catch {
        return { state: "off", needsInstall };
      }
    };

    detect().then((result) => {
      if (!cancelled) setStatus(result);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // مرجع ثابت، فلا يُبطل useCallback أدناه مع كل رسم.
  const setState = useCallback(
    (next: State) => setStatus((prev) => ({ ...prev, state: next })),
    [],
  );

  const enable = useCallback(async () => {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        // مطلوب: كل رسالة دفع يجب أن تُظهر إشعارًا مرئيًّا للعضو.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const raw = subscription.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      if (!raw.endpoint || !raw.keys?.p256dh || !raw.keys?.auth) {
        setState("failed");
        return;
      }

      const { ok } = await saveSubscription({
        endpoint: raw.endpoint,
        keys: { p256dh: raw.keys.p256dh, auth: raw.keys.auth },
      });
      setState(ok ? "on" : "failed");
    } catch {
      setState("failed");
    }
  }, [vapidPublicKey, setState]);

  const disable = useCallback(async () => {
    setState("busy");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // نُلغيه عند المتصفح أوّلًا ثم نحذف صفّه: لو انعكس الترتيب وفشل
        // الإلغاء لبقي اشتراك حيّ لا صفّ له، فيصل تنبيه لا نعرف مصدره.
        await subscription.unsubscribe();
        await removeSubscription(subscription.endpoint);
      }
      setState("off");
    } catch {
      setState("failed");
    }
  }, [setState]);

  if (state === "checking") return null;

  return (
    <section className="rounded-xl border border-ink-line bg-ink-soft/40 p-5">
      <h2 className="font-bold text-gold-light">{d.pushTitle}</h2>
      <p className="mt-1.5 text-sm leading-7 text-parchment/70">{d.pushBody}</p>

      {state === "on" ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-tick-green">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-tick-green" />
            {d.pushOn}
          </span>
          <button
            type="button"
            onClick={disable}
            className="text-sm text-parchment/55 underline underline-offset-4 transition-colors hover:text-gold"
          >
            {d.pushDisable}
          </button>
        </div>
      ) : state === "denied" ? (
        <p className="mt-4 text-sm text-tick-absent">{d.pushDenied}</p>
      ) : state === "unsupported" && !needsInstall ? (
        <p className="mt-4 text-sm text-parchment/55">{d.pushUnsupported}</p>
      ) : state !== "unsupported" ? (
        <>
          <button
            type="button"
            onClick={enable}
            disabled={state === "busy"}
            aria-busy={state === "busy"}
            className="mt-4 rounded-sm bg-gold px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "busy" ? d.pushEnabling : d.pushEnable}
          </button>
          {state === "failed" && <p className="mt-2 text-sm text-tick-red">{d.pushFailed}</p>}
        </>
      ) : null}

      {needsInstall && (
        <div className="mt-4 rounded-lg border border-gold/25 bg-gold/5 p-4">
          <p className="text-sm font-bold text-gold-light">{d.pushIosTitle}</p>
          <p className="mt-1.5 text-sm leading-7 text-parchment/70">{d.pushIosBody}</p>
        </div>
      )}

      {/* أضمن طريقٍ للتنبيهات هو التطبيق نفسه: أيقونةٌ في الشاشة تُفتح، بخلاف
          موقعٍ يُنسى في قائمة العلامات. */}
      <Link
        href="/app"
        className="mt-4 inline-block text-sm text-parchment/55 underline underline-offset-4 transition-colors hover:text-gold"
      >
        {strings.app.fromInbox}
      </Link>
    </section>
  );
}
