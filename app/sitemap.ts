import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * الصفحات العامّة وحدها.
 *
 * لا تُدرج لوحة العضو ولا الإدارة: هي خلف جلسة، وإدراجها يُغري الزاحف
 * بصفحةٍ لا يراها إلّا صاحبها — ثمّ يُسجَّل عنوانها في نتائج البحث بلا فائدة.
 *
 * والقائمة مكتوبةٌ بيدٍ لا مولَّدة: الموقع أربع صفحاتٍ عامّة، وتوليدها من
 * نظام الملفّات كان سيُدخل الصفحات المحميّة سهوًا عند إضافة أيّ مسارٍ جديد.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/app`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
