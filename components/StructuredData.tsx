// بيانات منظَّمة (JSON-LD) — كيف يفهم محرّك البحث أنّ هذه صفحة ناد.
//
// من غيرها يقرأ جوجل نصًّا عربيًّا جميلًا ولا يعرف أنّ له اسمًا ولوغو
// وحساباتٍ رسمية. و`sameAs` هي التي تربط الموقع بحسابات فيسبوك وإنستغرام
// وواتساب — بها يعرف المحرّك أنّها لنا لا لمنتحل، فتظهر معًا في النتيجة.
//
// وتُقرأ الحسابات من نفس مصدر التذييل، فلا يفترق ما يراه الزائر عمّا يقرؤه
// المحرّك حين يُضاف حسابٌ أو يُحذف.
import { footer } from "@/lib/site-content";
import { SITE_URL } from "@/lib/site-url";

export default function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "نادي الجيل الصاعد",
    alternateName: "Club Jil Saad",
    url: SITE_URL,
    logo: `${SITE_URL}/assets/logo-mark.svg`,
    image: `${SITE_URL}/og.png`,
    description: footer.content.line,
    inLanguage: "ar",
    sameAs: footer.content.social.map((s) => s.url),
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD يُحقن نصًّا، وهذا هو الوجه المشروع الوحيد لهذه الخاصية:
      // المحتوى مبنيٌّ عندنا لا وارد من مستخدم. و`<` تُهرَّب لئلّا يُغلق
      // وسمُ script مبكّرًا لو تسلّل يومًا إلى نصٍّ قابلٍ للتحرير.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
