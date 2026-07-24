import type { Metadata, Viewport } from "next";
import { Reem_Kufi, Tajawal, Noto_Naskh_Arabic, Lalezar } from "next/font/google";
import { strings } from "@/lib/strings";
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

export const metadata: Metadata = {
  title: "نادي الجيل الصاعد",
  description:
    "نادٍ طلابيٌّ دعويّ يجمع طلبة الجامعة على كتاب الله — برنامج حفظ القرآن الكريم، استظهارٌ أسبوعي، وصحبةٌ صالحة.",
};

export const viewport: Viewport = {
  themeColor: "#14100B",
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
