import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * ما يُسمح للزاحف برؤيته.
 *
 * الصفحات العامّة مفتوحة، وما خلف تسجيل الدخول ممنوعٌ صراحةً: `/dashboard`
 * و`/manage` محميّان بالجلسة وRLS على كلّ حال، لكنّ المنع هنا يمنع ظهور
 * عناوينها في نتائج البحث أصلًا — ولا داعي لأن يعرف الناس أين لوحة الإدارة.
 *
 * و`/api` ممنوعة لأنّها ليست صفحاتٍ تُقرأ، وزحفُها ينفق حصّة الاستدعاءات
 * على لا شيء.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/manage", "/api", "/auth", "/reset-password", "/pending"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
