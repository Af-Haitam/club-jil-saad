import Reveal from "@/components/Reveal";

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  dark?: boolean;
  /** العناوين المشكولة تُعرض بخط النسخ — الكوفي مع الحركات غير مقروء */
  vocalizedTitle?: boolean;
}

/** رأس قسم موحّد: عقدة معينية + سطر تمهيدي + عنوان */
export default function SectionHead({
  eyebrow,
  title,
  dark,
  vocalizedTitle,
}: SectionHeadProps) {
  return (
    <Reveal className="relative mb-12 flex flex-col items-center text-center">
      <span className="thread-node mb-5" aria-hidden="true" />
      <p
        className={`mb-3 text-sm tracking-widest ${dark ? "text-gold-light/80" : "text-gold-deep"}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`${vocalizedTitle ? "font-naskh font-semibold" : "font-display"} text-3xl leading-[1.6] sm:text-4xl ${dark ? "text-parchment" : "text-navy"}`}
      >
        {title}
      </h2>
    </Reveal>
  );
}
