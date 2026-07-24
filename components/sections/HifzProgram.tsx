import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import GeoPattern from "@/components/GeoPattern";
import { hifz } from "@/lib/site-content";

const c = hifz.content;

export default function HifzProgram() {
  return (
    <section
      id="hifz"
      className="relative overflow-hidden bg-ink py-24 text-parchment"
    >
      <div className="absolute inset-0 text-gold">
        <GeoPattern opacity={0.04} />
      </div>
      <div className="relative mx-auto max-w-3xl px-5">
        <SectionHead eyebrow={c.eyebrow} title={c.title} dark vocalizedTitle />

        {/* النص الرسمي للنادي — مشكول، بخط النسخ، داخل إطار مذهّب كصفحة مصحف */}
        <Reveal delay={0.1}>
          <div className="relative border border-gold/30 bg-ink-soft/60 p-7 sm:p-10">
            {/* أركان الإطار */}
            <span className="absolute top-0 start-0 h-4 w-4 border-t-2 border-s-2 border-gold" aria-hidden="true" />
            <span className="absolute top-0 end-0 h-4 w-4 border-t-2 border-e-2 border-gold" aria-hidden="true" />
            <span className="absolute bottom-0 start-0 h-4 w-4 border-b-2 border-s-2 border-gold" aria-hidden="true" />
            <span className="absolute bottom-0 end-0 h-4 w-4 border-b-2 border-e-2 border-gold" aria-hidden="true" />

            <div className="vocalized space-y-6 text-justify text-base sm:text-lg text-parchment/90">
              {c.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
