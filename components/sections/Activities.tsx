import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import GeoPattern from "@/components/GeoPattern";
import { activities } from "@/lib/site-content";

const c = activities.content;

export default function Activities() {
  return (
    <section
      id="activities"
      className="relative overflow-hidden bg-ink py-24 text-parchment"
    >
      <div className="absolute inset-0 text-gold">
        <GeoPattern opacity={0.04} />
      </div>
      <div className="relative mx-auto max-w-5xl px-5">
        <SectionHead eyebrow={c.eyebrow} title={c.title} dark />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {c.items.map((item, i) => (
            <Reveal key={item.title} delay={0.1 + (i % 3) * 0.1}>
              {/* TODO(asset): صورة حقيقية لكل نشاط عند توفرها */}
              <div className="group h-full border border-gold/20 bg-ink-soft/70 p-6 transition-all duration-300 hover:border-gold/60 hover:bg-ink-soft">
                <span className="thread-node mb-4 opacity-70 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                <h3 className="font-display text-lg text-gold-light">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-parchment/65">
                  {item.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
