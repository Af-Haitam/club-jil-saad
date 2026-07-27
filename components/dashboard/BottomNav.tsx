"use client";

// شريط التبويبات السفلي — على الهاتف وحده.
//
// هذا هو الفرق الأكبر بين «موقع» و«تطبيق». الترويسة العلوية بأربعة روابط
// نصّية شكلُ موقعٍ لا يشبه أيّ تطبيقٍ على هاتف العضو؛ والشريط السفلي هو ما
// تعرفه إبهامه. على الحواسيب يبقى التنقّل أعلى كما كان.

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { strings } from "@/lib/strings";

export default function BottomNav({
  unread,
  showManage,
}: {
  unread: number;
  showManage: boolean;
}) {
  const pathname = usePathname();
  const d = strings.dashboard;

  const tabs = [
    { href: "/dashboard", label: d.navOverview, icon: <GridIcon />, exact: true },
    { href: "/dashboard/inbox", label: d.navInbox, icon: <BellIcon />, badge: unread },
    { href: "/dashboard/profile", label: d.navProfile, icon: <PersonIcon /> },
    ...(showManage
      ? [{ href: "/manage", label: strings.manage.title, icon: <SlidersIcon /> }]
      : []),
  ];

  return (
    <nav
      aria-label={d.navOverview}
      // pb يحمل حافّة الأمان: على الهواتف ذات شريط الإيماءات السفلي يقع
      // الشريط تحت الإصبع تمامًا بدونها.
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 py-2.5 transition-colors ${
                  active ? "text-gold" : "text-parchment/55"
                }`}
              >
                <span className="relative">
                  {tab.icon}
                  {tab.badge ? (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 -start-2 min-w-4 rounded-full bg-gold px-1 text-center text-[10px] font-bold leading-4 text-ink"
                    >
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  ) : null}
                </span>
                <span className="text-[11px] leading-none">{tab.label}</span>
                {/* خيط ذهبي فوق التبويب النشط — نفس لغة الخيوط في الموقع */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gold"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// شبكة الأسابيع
function GridIcon() {
  return (
    <Icon>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </Icon>
  );
}

function BellIcon() {
  return (
    <Icon>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5" />
      <path d="M13.7 19a2 2 0 0 1-3.4 0" />
    </Icon>
  );
}

function PersonIcon() {
  return (
    <Icon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" />
    </Icon>
  );
}

function SlidersIcon() {
  return (
    <Icon>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </Icon>
  );
}
