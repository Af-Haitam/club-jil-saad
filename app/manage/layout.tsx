// قوقعة الإدارة — بوّابة الدور: المدير/المشرف فقط، وإلا يُعاد إلى لوحة العضو.
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getStaffProfile } from "@/lib/manage/queries";
import { signOut } from "@/lib/auth/actions";
import { strings } from "@/lib/strings";

export default async function ManageLayout({ children }: { children: ReactNode }) {
  const me = await getStaffProfile();
  if (!me) redirect("/dashboard");
  const m = strings.manage;

  return (
    <div className="min-h-svh bg-ink text-parchment">
      <header className="sticky top-0 z-40 border-b border-ink-line bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <Link href="/manage" className="flex items-center gap-2.5">
            <Image src="/assets/logo-mark.svg" alt={strings.logoAlt} width={24} height={28} unoptimized className="h-7 w-auto" />
            <span className="gold-text font-logo text-lg leading-[1.8]">{m.title}</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <a href="/manage#record" className="text-parchment/80 transition-colors hover:text-gold">
              {m.navRecord}
            </a>
            <a href="/manage#members" className="text-parchment/80 transition-colors hover:text-gold">
              {m.navMembers}
            </a>
            <a href="/manage#halaqat" className="text-parchment/80 transition-colors hover:text-gold">
              {m.navHalaqat}
            </a>
            <a href="/manage#exams" className="text-parchment/80 transition-colors hover:text-gold">
              {m.navExams}
            </a>
            <a href="/manage#content" className="text-parchment/80 transition-colors hover:text-gold">
              {m.navContent}
            </a>
            <a href="/manage#questions" className="text-parchment/80 transition-colors hover:text-gold">
              {m.navQuestions}
            </a>
            <span className="text-ink-line" aria-hidden="true">
              |
            </span>
            <Link href="/dashboard" className="text-parchment/60 transition-colors hover:text-gold">
              {m.toDashboard}
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-parchment/60 transition-colors hover:text-gold">
                {m.signOut}
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
