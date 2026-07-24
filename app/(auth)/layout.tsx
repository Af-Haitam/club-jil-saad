// القالب المشترك لكل شاشات الدخول/التسجيل — بطاقة وسط خلفية فحمية،
// شعار الريشة الذهبية + اسم النادي أعلى البطاقة.
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import GeoPattern from "@/components/GeoPattern";
import { strings } from "@/lib/strings";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-ink px-5 py-12">
      {/* نفس الزخرفة الهندسية الخافتة المستعملة في Hero/JoinCta */}
      <div className="absolute inset-0 text-gold">
        <GeoPattern opacity={0.05} />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-ink)_78%)]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <Link href="/" className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/assets/logo-mark.svg"
            alt={strings.logoAlt}
            width={54}
            height={64}
            unoptimized
            className="h-12 w-auto"
          />
          <span className="gold-text font-logo text-2xl leading-[1.8]">{strings.auth.brand}</span>
        </Link>

        <div className="w-full rounded-lg border border-ink-line bg-ink-soft/70 p-6 text-start backdrop-blur-sm sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
