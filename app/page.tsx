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
import * as content from "@/lib/site-content";

// ترتيب الأقسام يأتي من site-content — نفس بنية site_sections في قاعدة
// البيانات مستقبلًا، فيصبح تفعيل محرر المدير في المرحلة 6 نقل بيانات فقط.
const sections = [
  { data: content.hero, Component: Hero },
  { data: content.about, Component: About },
  { data: content.hifz, Component: HifzProgram },
  { data: content.participation, Component: Participation },
  { data: content.tracking, Component: Tracking },
  { data: content.activities, Component: Activities },
  { data: content.stats, Component: Stats },
  { data: content.cta, Component: JoinCta },
]
  .filter((s) => s.data.visible)
  .sort((a, b) => a.data.order - b.data.order);

export default function Home() {
  return (
    <MotionProvider>
      <Navbar />
      {/* الخيط الذهبي يُرسم داخل كل قسم فوق خلفيته — لا كطبقة عامة تُطمس */}
      <main id="main" className="relative">
        {sections.map(({ data, Component }) => (
          <Component key={data.type} />
        ))}
      </main>
      {content.footer.visible && <Footer />}
    </MotionProvider>
  );
}
