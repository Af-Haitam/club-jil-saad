/**
 * عنوان الموقع — مصدرٌ واحد.
 *
 * يقرؤه التخطيط (metadataBase) وrobots وsitemap. وهو في ملفٍّ مستقلّ لا في
 * `app/layout.tsx` كي لا تسحب `robots.ts` و`sitemap.ts` وحدةَ التخطيط معها،
 * وفيها أربعة خطوطٍ من `next/font` لا حاجة لها في ملفٍّ نصّيّ.
 *
 * ولو أُضيف نطاقٌ خاصّ يومًا فهذا السطر وحده يتغيّر — ومعه أصلُ
 * `assetlinks.json` الذي يربط تطبيق أندرويد بالموقع.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://club-jil-saad.vercel.app";
