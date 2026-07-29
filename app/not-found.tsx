// صفحة ٤٠٤ — عربية كسائر الموقع.
//
// كانت Next تعرض صفحتها الافتراضية الإنجليزية، وهي أوّل ما يراه من فتح
// رابطًا قديمًا أو أخطأ في العنوان.
import Link from "next/link";
import { strings } from "@/lib/strings";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-ink px-6 py-16 text-center text-parchment">
      <p className="font-logo text-5xl leading-none text-gold/60">404</p>
      <h1 className="font-logo text-2xl leading-[1.8] text-gold-light">
        {strings.notFoundTitle}
      </h1>
      <p className="max-w-sm text-sm leading-8 text-parchment/70">{strings.notFoundBody}</p>
      <Link
        href="/"
        className="mt-2 rounded-sm border border-gold/45 px-6 py-2.5 text-sm text-gold transition-colors hover:bg-gold hover:text-ink"
      >
        {strings.errorHome}
      </Link>
    </div>
  );
}
