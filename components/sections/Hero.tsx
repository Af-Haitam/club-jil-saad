"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import GeoPattern from "@/components/GeoPattern";
import { hero } from "@/lib/site-content";
import { strings } from "@/lib/strings";

const c = hero.content;

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 26 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-ink px-5 text-center"
    >
      {/* الزخرفة الهندسية */}
      <div className="absolute inset-0 text-gold">
        <GeoPattern opacity={0.05} />
      </div>
      {/* تدرّج يغرق أطراف الزخرفة */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-ink)_78%)]" />

      <div className="relative z-10 flex flex-col items-center">
        {/* الريشة — الشعار الأساسي، مع وميض دافئ خلفه */}
        <div className="relative mb-7">
          <div className="hero-glow absolute inset-0 -m-10 rounded-full bg-gold/15 blur-3xl" />
          <motion.div className="m-init" {...anim(0.1)}>
            <Image
              src={c.logo}
              alt={strings.logoAltHero}
              width={211}
              height={252}
              preload
              unoptimized
              className="relative h-auto w-36 sm:w-40 md:w-48"
            />
          </motion.div>
        </div>

        {/* اسم النادي — نص حقيقي بأقرب خط لحروف الشعار وتدرّجه الذهبي */}
        {/* leading + padding واسعان — وإلا قُصّت نقاط الحروف النازلة،
            لأن التدرج لا يُرسم إلا داخل صندوق العنصر */}
        <motion.h1
          className="m-init gold-text font-logo text-4xl sm:text-5xl md:text-6xl leading-[1.8] px-4 -my-3"
          {...anim(0.35)}
        >
          {c.name}
        </motion.h1>

        <motion.p
          {...anim(0.55)}
          className="m-init mt-8 font-display text-gold-light text-xl sm:text-2xl md:text-3xl tracking-wide"
        >
          {c.tagline}
        </motion.p>

        <motion.p
          {...anim(0.75)}
          className="m-init mt-6 max-w-xl text-parchment/75 text-base sm:text-lg leading-8"
        >
          {c.lead}
        </motion.p>

        <motion.a
          {...anim(0.95)}
          href="#about"
          className="m-init group mt-14 flex flex-col items-center gap-2 text-gold/80 hover:text-gold transition-colors"
        >
          <span className="text-sm">{c.scrollCue}</span>
          <span className="block h-8 w-px bg-gradient-to-b from-gold/70 to-transparent transition-transform duration-500 group-hover:scale-y-125 origin-top" />
        </motion.a>
      </div>
    </section>
  );
}
