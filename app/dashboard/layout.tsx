// قوقعة لوحة العضو — ترويسة ثابتة + بوّابة الحالة: من ليس "active" يُعاد إلى
// شاشة الانتظار، وغير المسجَّل إلى الدخول. تُطبَّق على /dashboard و/dashboard/*.
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/user";
import { getUnreadCount } from "@/lib/dashboard/inbox";
import BottomNav from "@/components/dashboard/BottomNav";
import { signOut } from "@/lib/auth/actions";
import { strings } from "@/lib/strings";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "active") redirect("/pending");

  const unread = await getUnreadCount();

  const d = strings.dashboard;
  const firstName = profile.full_name.trim().split(/\s+/)[0];

  return (
    <div className="min-h-svh bg-ink text-parchment">
      {/* حافّة الأمان العليا: مع viewport-fit=cover يمتدّ المحتوى تحت نتوء
          الآيفون، فتُدفع الترويسة إلى أسفله. تساوي صفرًا على ما سواه. */}
      <header className="sticky top-0 z-40 border-b border-ink-line bg-ink/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3">
          {/* الشعار يعود إلى الصفحة الرئيسية لا إلى اللوحة — على الهاتف
              خصوصًا لم يكن ثمّة طريق للخروج من اللوحة إلى الموقع العلني.
              و«المتابعة» في الشريط تكفي للعودة إلى اللوحة نفسها. */}
          <Link
            href="/"
            aria-label={d.homeFromDashboard}
            className="flex items-center gap-2.5 rounded-sm transition-opacity hover:opacity-85"
          >
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
          {/* على الهاتف لا يبقى في الترويسة إلّا الشعار والخروج — التنقّل كلّه
              نزل إلى الشريط السفلي حيث يصله الإبهام. أربعة روابط نصّية
              متلاصقة أعلى الشاشة هي أوضح علامةٍ على أنّ ما تنظر إليه موقع. */}
          <nav className="flex items-center gap-4 text-sm">
            <span className="hidden md:contents">
              <InboxBell unread={unread} />
              <Link href="/dashboard" className="text-parchment/80 transition-colors hover:text-gold">
                {d.navOverview}
              </Link>
              <Link
                href="/dashboard/profile"
                className="text-parchment/80 transition-colors hover:text-gold"
              >
                {d.navProfile}
              </Link>
              {(profile.role === "admin" || profile.role === "supervisor") && (
                <Link href="/manage" className="text-gold/90 transition-colors hover:text-gold">
                  {strings.manage.title}
                </Link>
              )}
            </span>
            <form action={signOut}>
              <button type="submit" className="text-parchment/60 transition-colors hover:text-gold">
                {d.signOut}
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* الشريط 60px هنا، لكنّه يصير نحو 94px على هاتفٍ بشريط إيماءاتٍ سفلي
          (env يضيف ~34px). pb-32 = 128px يترك فسحة 34px في أضيق الحالات؛
          pb-28 كان يتركها 18px وهو ضيّق على إبهام. */}
      <main className="mx-auto max-w-4xl px-5 pt-8 pb-32 md:pb-8">
        <p className="mb-6 text-lg text-parchment/85">
          {d.greeting} <span className="font-bold text-gold-light">{firstName}</span>
        </p>
        {children}
      </main>

      <BottomNav
        unread={unread}
        showManage={profile.role === "admin" || profile.role === "supervisor"}
      />
    </div>
  );
}

// جرس الإشعارات. أيقونة لا كلمة: شريط التنقّل يحمل أربعة روابط عربية أصلًا،
// وكلمة خامسة تدفعه إلى سطرين على الهاتف. الاسم المقروء آليًّا عربيّ كامل.
function InboxBell({ unread }: { unread: number }) {
  const d = strings.dashboard;
  const label = unread > 0 ? `${d.navInbox} — ${d.inboxUnreadLabel} ${unread}` : d.navInbox;

  return (
    <Link
      href="/dashboard/inbox"
      aria-label={label}
      className="relative -m-1 p-1 text-parchment/80 transition-colors hover:text-gold"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5" />
        <path d="M13.7 19a2 2 0 0 1-3.4 0" />
      </svg>
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -start-0.5 min-w-4 rounded-full bg-gold px-1 text-center text-[10px] font-bold leading-4 text-ink"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
