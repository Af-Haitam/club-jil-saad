import { Fragment } from "react";
import Navbar from "@/components/Navbar";
import MotionProvider from "@/components/MotionProvider";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import HifzProgram from "@/components/sections/HifzProgram";
import Participation from "@/components/sections/Participation";
import Tracking from "@/components/sections/Tracking";
import Activities from "@/components/sections/Activities";
import Stats from "@/components/sections/Stats";
import JoinCta from "@/components/sections/JoinCta";
import Footer from "@/components/sections/Footer";
import { getSections, type SiteSectionRow } from "@/lib/site/queries";
import type {
  HeroContent,
  AboutContent,
  HifzContent,
  ParticipationContent,
  TrackingContent,
  ActivitiesContent,
  StatsContent,
  CtaContent,
  FooterContent,
} from "@/lib/site-content";

// الترتيب والظهور والمحتوى تأتي كلها من site_sections عبر getSections،
// وتسقط إلى lib/site-content.ts إن كان الجدول فارغًا أو المشروع نائمًا.

// تبقى الصفحة ثابتة (getSections بلا كوكيز)، وتُجدَّد كل ساعة احتياطًا.
// الحفظ في المحرّر يستدعي revalidatePath("/") فيظهر التعديل فورًا لا بعد ساعة.
export const revalidate = 3600;

/** لكل نوع مكوّنه. التحويل صريح هنا لأنّ القاعدة تُعيد jsonb بلا نوع. */
function renderSection(s: SiteSectionRow) {
  switch (s.type) {
    case "hero":
      return <Hero content={s.content as HeroContent} />;
    case "about":
      return <About content={s.content as AboutContent} />;
    case "hifz":
      return <HifzProgram content={s.content as HifzContent} />;
    case "participation":
      return <Participation content={s.content as ParticipationContent} />;
    case "tracking":
      return <Tracking content={s.content as TrackingContent} />;
    case "activities":
      return <Activities content={s.content as ActivitiesContent} />;
    case "stats":
      return <Stats content={s.content as StatsContent} />;
    case "cta":
      return <JoinCta content={s.content as CtaContent} />;
    default:
      return null; // التذييل يُرسم خارج <main>، وأي نوع مجهول يُتجاهل بصمت
  }
}

export default async function Home() {
  const sections = await getSections();

  // RLS يخفي غير المرئي عن الزائر، لكن المدير يرى كل شيء — فنُرشّح هنا أيضًا.
  const visible = sections.filter((s) => s.is_visible).sort((a, b) => a.order_index - b.order_index);
  const footer = visible.find((s) => s.type === "footer");

  return (
    <MotionProvider>
      <Navbar />
      {/* الخيط الذهبي يُرسم داخل كل قسم فوق خلفيته — لا كطبقة عامة تُطمس */}
      <main id="main" className="relative">
        {visible
          .filter((s) => s.type !== "footer")
          .map((s) => (
            <Fragment key={s.type}>{renderSection(s)}</Fragment>
          ))}
      </main>
      {footer && <Footer content={footer.content as FooterContent} />}
    </MotionProvider>
  );
}
