import type { Metadata, Viewport } from "next";
import { Reem_Kufi, Tajawal, Noto_Naskh_Arabic, Lalezar } from "next/font/google";
import { strings } from "@/lib/strings";
// `metadataBase` شرطٌ لأن تصير روابط الصورة مطلقة — والمعاينات لا تقبل
// رابطًا نسبيًّا، فيظهر الرابط بلا صورة أصلًا.
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

// الأوزان المحمّلة هي المستعملة فعلًا فقط — كل وزن ملفات تُنقل للزائر
const reemKufi = Reem_Kufi({
  subsets: ["arabic"],
  weight: ["400", "600"],
  variable: "--font-reem-kufi",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

const notoNaskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600"],
  variable: "--font-noto-naskh",
  display: "swap",
});

// أقرب خط لحروف الشعار — لاسم النادي فقط
const lalezar = Lalezar({
  subsets: ["arabic"],
  weight: "400",
  variable: "--font-lalezar",
  display: "swap",
});

const NAME = "نادي الجيل الصاعد";
const DESCRIPTION =
  "نادٍ طلابيٌّ دعويّ يجمع طلبة الجامعة على كتاب الله — برنامج حفظ القرآن الكريم، استظهارٌ أسبوعي، وصحبةٌ صالحة.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: NAME, template: `%s — ${NAME}` },
  description: DESCRIPTION,
  applicationName: NAME,
  alternates: { canonical: "/" },
  keywords: [
    "نادي الجيل الصاعد",
    "حفظ القرآن",
    "نادي دعوي",
    "حلقات تحفيظ",
    "استظهار",
    "طلبة الجامعة",
  ],

  /**
   * المعاينة عند المشاركة.
   *
   * وهي ليست تحسينًا تجميليًّا هنا: النادي يُعرَّف بالمشاركة في قناتَي
   * واتساب وفيسبوك وإنستغرام، وبلا هذه الوسوم يظهر الرابط عاريًا — سطرَ
   * عنوانٍ لا صورة فيه ولا اسم. والصورة `og.png` مبنيّةٌ من متجهات الشعار
   * نفسها فلا يُكسَر فيها حرفٌ عربيّ.
   */
  openGraph: {
    type: "website",
    siteName: NAME,
    title: NAME,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "ar_MA",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: NAME,
    description: DESCRIPTION,
    images: ["/og.png"],
  },

  // لوحات الأعضاء والإدارة خلف تسجيل دخول، لكنّ منعها صراحةً أوضح من
  // الاتّكال على أنّ الزاحف لن يجد لها رابطًا.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#14100B",
  // مثبَّت كتطبيق على آيفون: بدون cover يُحاط المحتوى بشريطين أسودين حول
  // النتوء. ومعه تلزم حواف الأمان في الترويسة والشريط السفلي — وهي مضبوطة.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      dir="rtl"
      lang="ar"
      className={`${reemKufi.variable} ${tajawal.variable} ${notoNaskh.variable} ${lalezar.variable}`}
    >
      <body className="bg-ink text-parchment font-body antialiased">
        {/* بلا جافاسكريبت: عناصر الحركة تصل من الخادم مخفية — تُظهر فورًا */}
        <noscript>
          <style>{`.m-init{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <a href="#main" className="skip-link">
          {strings.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
