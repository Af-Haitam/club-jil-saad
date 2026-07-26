// عامل الخدمة — يستقبل رسالة الدفع ويعرضها، ويفتح الصندوق عند النقر.
//
// ملف عاديّ في public/ لا يمرّ ببناء Next: عامل الخدمة يجب أن يُخدَم من جذر
// الموقع (/sw.js) ليملك نطاق "/" كلّه، وهو شرط استقبال الدفع في كل صفحة.

// صفحة انقطاع الاتصال وحدها هي ما يُخزَّن. لا تُخزَّن أيّ صفحة حقيقية عمدًا:
// الجدول والصندوق يتغيّران، وصفحةٌ قديمة تُعرض على أنّها الحقيقة أسوأ من
// رسالة انقطاع.
const OFFLINE_CACHE = "club-offline-v1";
const OFFLINE_ASSETS = ["/offline.html", "/assets/logo-mark.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then((cache) => cache.addAll(OFFLINE_ASSETS)));
  // نسخة جديدة تحلّ محلّ القديمة فورًا بدل انتظار إغلاق كل التبويبات.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== OFFLINE_CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

// بلا هذا المستمع يعرض التطبيق صفحة خطأ كروم حين ينقطع الاتصال — بديناصورها.
// الشرط `navigate` مقصود: لا يمسّ هذا المستمع صورةً ولا طلب بيانات، فلا
// يستطيع أن يُقدّم محتوى قديمًا. الشبكة أوّلًا دائمًا، والمخزَّن عند فشلها فقط.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    (async () => {
      try {
        return await fetch(event.request);
      } catch {
        const cache = await caches.open(OFFLINE_CACHE);
        const offline = await cache.match("/offline.html");
        return offline || Response.error();
      }
    })(),
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // حمولة غير JSON — نعرض نصّها الخام بدل ابتلاع الرسالة.
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "نادي الجيل الصاعد";
  const url = payload.url || "/dashboard/inbox";

  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    dir: "rtl",
    lang: "ar",
    data: { url },
  };

  // صورة الإعلان تُعرض كبيرةً داخل التنبيه على أندرويد. تتجاهلها المنصّات
  // التي لا تدعمها بلا ضرر، فلا حاجة إلى فحص مسبق.
  if (payload.image) options.image = payload.image;

  // tag يجعل الرسالة تحلّ محلّ سابقتها. تذكير الحصّة اليومي يستحقّه (لا فائدة
  // من تذكيرَي أمس واليوم معًا)، أمّا الإعلانات فتتراكم لأن لكلٍّ خبره.
  if (payload.tag) options.tag = payload.tag;

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard/inbox";

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // تبويب مفتوح على الوجهة نفسها؟ نُركّزه بدل فتح نافذة ثانية.
      for (const client of windows) {
        try {
          if (new URL(client.url).pathname === url && "focus" in client) {
            return client.focus();
          }
        } catch {
          // عنوان غير قابل للتحليل — نتجاهله ونكمل البحث.
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
