// بيان التطبيق (PWA). ليس ترفًا: تنبيهات الآيفون لا تعمل من سفاري مباشرة —
// تشترط أن يُضاف الموقع إلى الشاشة الرئيسية أوّلًا، وهذا الملف شرط ذلك.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "نادي الجيل الصاعد",
    short_name: "الجيل الصاعد",
    description:
      "نادٍ طلابيٌّ دعويّ يجمع طلبة الجامعة على كتاب الله — حفظ القرآن الكريم واستظهارٌ أسبوعي.",
    // العضو الذي يفتح الأيقونة يريد متابعته، لا الصفحة التعريفية.
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "ar",
    background_color: "#14100B",
    theme_color: "#14100B",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
