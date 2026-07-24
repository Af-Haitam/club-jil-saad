import Reveal from "@/components/Reveal";
import GeoPattern from "@/components/GeoPattern";
import { cta } from "@/lib/site-content";

const c = cta.content;

export default function JoinCta() {
  return (
    <section
      id="join"
      className="relative overflow-hidden bg-ink py-28 text-center text-parchment"
    >
      <div className="absolute inset-0 text-gold">
        <GeoPattern opacity={0.05} />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-ink)_80%)]" />
      <div className="relative mx-auto max-w-2xl px-5">
        <Reveal>
          <span className="thread-node mx-auto mb-6" aria-hidden="true" />
          <h2 className="font-display text-3xl sm:text-4xl text-gold-light">
            {c.title}
          </h2>
          <p className="mx-auto mt-5 max-w-lg leading-8 text-parchment/75">
            {c.text}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={c.primary.href}
              className="rounded-sm bg-gold px-8 py-3 font-medium text-ink transition-colors duration-300 hover:bg-gold-light"
            >
              {c.primary.label}
            </a>
            <a
              href={c.secondary.href}
              className="rounded-sm border border-parchment/30 px-8 py-3 text-parchment/85 transition-colors duration-300 hover:border-gold hover:text-gold"
            >
              {c.secondary.label}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
