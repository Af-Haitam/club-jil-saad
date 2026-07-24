import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { participation } from "@/lib/site-content";
import { arabicDigits } from "@/lib/strings";

const c = participation.content;

export default function Participation() {
  return (
    <section id="participation" className="relative bg-parchment py-24 text-navy">
      <div className="relative mx-auto max-w-4xl px-5">
        <SectionHead eyebrow={c.eyebrow} title={c.title} vocalizedTitle />

        {/* النص الرسمي — مشكول بخط النسخ */}
        <Reveal delay={0.1}>
          <p className="vocalized mx-auto max-w-3xl text-center text-base sm:text-lg text-navy/85">
            {c.official}
          </p>
        </Reveal>

        {/* الخطوات الثلاث معلّقة على خيط أفقي — عُقَد على مسار واحد،
            لا صناديق كباقي الأقسام */}
        <div className="relative mt-16">
          <div
            className="absolute top-[5px] hidden h-px bg-gold/40 sm:block"
            style={{ insetInlineStart: "16.6%", insetInlineEnd: "16.6%" }}
            aria-hidden="true"
          />
          <ol className="grid gap-10 sm:grid-cols-3 sm:gap-6">
            {c.steps.map((step, i) => (
              <Reveal key={step.title} delay={0.15 + i * 0.12}>
                <li className="flex h-full flex-col items-center text-center">
                  <span className="thread-node mb-3" aria-hidden="true" />
                  <span className="mb-2 text-sm text-gold-deep" aria-hidden="true">
                    {arabicDigits(i + 1)}
                  </span>
                  <h3 className="font-display text-lg text-navy">{step.title}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-7 text-navy/75">
                    {step.text}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
