import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { about } from "@/lib/site-content";

const c = about.content;

export default function About() {
  return (
    <section id="about" className="relative bg-parchment py-24 text-navy">
      <div className="relative mx-auto max-w-4xl px-5">
        <SectionHead eyebrow={c.eyebrow} title={c.title} />

        <Reveal delay={0.1}>
          <div className="space-y-5 text-center text-lg leading-9 text-navy/85">
            {c.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {c.pillars.map((pillar, i) => (
            <Reveal key={pillar.title} delay={0.15 + i * 0.12}>
              <div className="group h-full border border-navy/15 bg-parchment-deep/40 p-6 text-center transition-colors duration-300 hover:border-gold">
                {/* العناوين مشكولة — خط النسخ أوضح من الكوفي للحركات */}
                <h3 className="font-naskh font-semibold text-xl leading-[1.9] text-gold-deep">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-navy/70">
                  {pillar.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
