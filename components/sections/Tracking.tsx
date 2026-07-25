import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import TrackingGrid from "@/components/TrackingGrid";
import { tracking } from "@/lib/site-content";
import type { TrackingContent } from "@/lib/site-content";


export default function Tracking({ content: c = tracking.content }: { content?: TrackingContent }) {
  return (
    <section id="tracking" className="relative bg-parchment-deep py-24 text-navy">
      <div className="relative mx-auto max-w-5xl px-5">
        <SectionHead eyebrow={c.eyebrow} title={c.title} />

        <Reveal delay={0.1}>
          <p className="mx-auto mb-10 max-w-2xl text-center leading-8 text-navy/80">
            {c.intro}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="border border-navy/20 bg-parchment p-3 sm:p-5 shadow-[0_2px_24px_rgba(35,44,84,0.08)]">
            <TrackingGrid />
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-navy/80">
            {c.legend.map((item) => (
              <span key={item.key} className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 items-center justify-center text-[10px] text-parchment ${item.key === "g" ? "bg-tick-green" : "bg-tick-red"}`}
                  aria-hidden="true"
                >
                  {item.key === "g" ? "✓" : "✕"}
                </span>
                {item.label}
              </span>
            ))}
          </div>

          {/* الجملة الجوهرية — لا إلزام ولا تشهير؛ تُعرض بارزة لا كهامش */}
          <p className="mx-auto mt-8 max-w-xl border-s-2 border-gold-deep ps-4 text-start text-base leading-8 text-navy/80">
            {c.note}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
