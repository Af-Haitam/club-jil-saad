import type { Metadata, Viewport } from "next";
import { Reem_Kufi, Tajawal, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";

const reemKufi = Reem_Kufi({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-reem-kufi",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

const notoNaskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-naskh",
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
    <html dir="rtl" lang="ar">
      <body
        className={`${reemKufi.variable} ${tajawal.variable} ${notoNaskh.variable} bg-ink text-parchment font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
