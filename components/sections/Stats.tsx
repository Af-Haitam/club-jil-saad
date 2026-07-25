import Reveal from "@/components/Reveal";
import { stats } from "@/lib/site-content";
import type { StatsContent } from "@/lib/site-content";
import { strings } from "@/lib/strings";


export default function Stats({ content: c = stats.content }: { content?: StatsContent }) {
  return (
    <section
      id="stats"
      className="relative border-y border-gold/25 bg-navy py-14 text-parchment"
    >
      <h2 className="sr-only">{strings.statsHeading}</h2>
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 md:grid-cols-4">
        {c.items.map((item, i) => (
          <Reveal key={item.label} delay={i * 0.1}>
            <div className="text-center">
              <p className="font-display text-4xl text-gold-light">
                {item.value}
              </p>
              <p className="mt-2 text-sm text-parchment/70">{item.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
