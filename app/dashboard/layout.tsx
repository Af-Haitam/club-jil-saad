// قوقعة لوحة العضو — ترويسة ثابتة + بوّابة الحالة: من ليس "active" يُعاد إلى
// شاشة الانتظار، وغير المسجَّل إلى الدخول. تُطبَّق على /dashboard و/dashboard/*.
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/user";
import { signOut } from "@/lib/auth/actions";
import { strings } from "@/lib/strings";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "active") redirect("/pending");

  const d = strings.dashboard;
  const firstName = profile.full_name.trim().split(/\s+/)[0];

  return (
    <div className="min-h-svh bg-ink text-parchment">
      <header className="sticky top-0 z-40 border-b border-ink-line bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/assets/logo-mark.svg"
              alt={strings.logoAlt}
              width={24}
              height={28}
              unoptimized
              className="h-7 w-auto"
            />
            <span className="gold-text font-logo text-lg leading-[1.8]">{strings.auth.brand}</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-parchment/80 transition-colors hover:text-gold">
              {d.navOverview}
            </Link>
            <Link href="/dashboard/profile" className="text-parchment/80 transition-colors hover:text-gold">
              {d.navProfile}
            </Link>
            {(profile.role === "admin" || profile.role === "supervisor") && (
              <Link href="/manage" className="text-gold/90 transition-colors hover:text-gold">
                {strings.manage.title}
              </Link>
            )}
            <form action={signOut}>
              <button type="submit" className="text-parchment/60 transition-colors hover:text-gold">
                {d.signOut}
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <p className="mb-6 text-lg text-parchment/85">
          {d.greeting} <span className="font-bold text-gold-light">{firstName}</span>
        </p>
        {children}
      </main>
    </div>
  );
}
