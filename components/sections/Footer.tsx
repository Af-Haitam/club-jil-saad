import Image from "next/image";
import { footer, navLinks } from "@/lib/site-content";
import type { FooterContent } from "@/lib/site-content";
import { strings } from "@/lib/strings";


export default function Footer({ content: c = footer.content }: { content?: FooterContent }) {
  // لا تُعرض بيانات تواصل ناقصة على صفحة عامة — تُخفى حتى تصل الحقيقية
  const hasContact = Object.values(c.contact).some((v) => v && v !== "—");

  return (
    <footer id="footer" className="border-t border-ink-line bg-ink-soft py-14 text-parchment">
      <div className="mx-auto max-w-5xl px-5">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col items-center md:items-start">
            <Image
              src="/assets/logo-mark.svg"
              alt={strings.logoAlt}
              width={54}
              height={64}
              className="h-16 w-auto"
              unoptimized
            />
            <p className="mt-4 max-w-xs text-center text-sm leading-7 text-parchment/60 md:text-start">
              {c.line}
            </p>
          </div>

          <nav aria-label={strings.footerNavLabel}>
            <ul className="flex flex-col items-center gap-2 text-sm text-parchment/70 md:items-start">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-gold transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="text-center text-sm text-parchment/60 md:text-start">
            <p className="font-medium text-gold-light">{strings.contactTitle}</p>
            {hasContact ? (
              <>
                <p className="mt-2">{strings.contactEmail}: {c.contact.email}</p>
                <p className="mt-1">{strings.contactPhone}: {c.contact.phone}</p>
                <p className="mt-1">{strings.contactCity}: {c.contact.city}</p>
              </>
            ) : (
              // TODO(asset): بيانات التواصل الحقيقية — تظهر تلقائيًا عند إدخالها
              <p className="mt-2">{strings.contactSoon}</p>
            )}
          </div>
        </div>

        <p className="mt-12 border-t border-ink-line pt-6 text-center text-xs text-parchment/55">
          © {c.hijriYear} / {c.gregYear} {c.name} — {strings.rights}
        </p>
      </div>
    </footer>
  );
}
