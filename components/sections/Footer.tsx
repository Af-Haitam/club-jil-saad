import Image from "next/image";
import { footer, navLinks } from "@/lib/site-content";
import type { FooterContent } from "@/lib/site-content";
import { strings } from "@/lib/strings";


export default function Footer({ content: c = footer.content }: { content?: FooterContent }) {
  // لا تُعرض بيانات تواصل ناقصة على صفحة عامة — تُخفى حتى تصل الحقيقية
  const hasContact = Object.values(c.contact).some((v) => v && v !== "—");

  // القسم مخزَّنٌ في `site_sections` منذ المرحلة ٦، وصفُّه في القاعدة كُتب
  // قبل وجود هذا الحقل — فهو `undefined` فيه لا مصفوفةً فارغة. بلا هذا
  // الرجوع يسقط التذييل كلّه على أوّل زائرٍ للصفحة الحيّة.
  const social = c.social ?? footer.content.social;

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

            {social.length > 0 && (
              <>
                <p className="mt-6 font-medium text-gold-light">{strings.followTitle}</p>
                <ul className="mt-3 flex items-center justify-center gap-3 md:justify-start">
                  {social.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        // noopener يمنع الصفحة المفتوحة من لمس صفحتنا عبر
                        // window.opener، وnoreferrer يمنع تسريب مسار الزائر.
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        title={s.label}
                        className="flex size-10 items-center justify-center rounded-full border border-gold/30 text-gold/80 transition-colors hover:border-gold hover:bg-gold hover:text-ink"
                      >
                        <SocialIcon kind={s.key} />
                      </a>
                    </li>
                  ))}
                </ul>
              </>
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

/**
 * أيقونات المنصّات — مرسومةٌ هنا لا محمَّلةٌ من حزمة.
 *
 * ثلاث أيقوناتٍ لا تستحقّ تبعيّةً تُحدَّث وتُدقَّق، ولا تستحقّ طلبَ شبكةٍ
 * إلى خادمٍ أجنبيّ في تذييل كلّ صفحة — وذلك وحده يسرّب زيارات الأعضاء.
 */
function SocialIcon({ kind }: { kind: "facebook" | "instagram" | "whatsapp" }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true as const,
  };

  if (kind === "facebook") {
    return (
      <svg {...common}>
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
      </svg>
    );
  }

  if (kind === "instagram") {
    return (
      <svg {...common}>
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.98c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.17-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.17.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.17-.21-.55-.47-.94-.88-1.35-.41-.41-.8-.67-1.35-.88-.41-.16-1.03-.35-2.17-.4-1.24-.06-1.59-.07-4.74-.07Zm0 3.37a4.49 4.49 0 1 1 0 8.98 4.49 4.49 0 0 1 0-8.98Zm0 7.4a2.91 2.91 0 1 0 0-5.82 2.91 2.91 0 0 0 0 5.82Zm5.72-7.6a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.09 3.2 5.07 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35ZM12.04 21.5h-.01a9.44 9.44 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.42 9.42 0 0 1-1.44-5.03c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.98 6.67 2.77a9.38 9.38 0 0 1 2.76 6.68c0 5.2-4.24 9.44-9.45 9.44ZM20.13 3.9A11.36 11.36 0 0 0 12.04.55C5.78.55.68 5.65.68 11.91c0 2 .52 3.95 1.52 5.67L.58 23.45l6.01-1.58a11.32 11.32 0 0 0 5.45 1.39h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.03-1.18-5.89-3.33-8.03Z" />
    </svg>
  );
}
