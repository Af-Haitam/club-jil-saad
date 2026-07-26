import type { Metadata } from "next";

import { getInbox } from "@/lib/dashboard/inbox";
import InboxList from "@/components/dashboard/InboxList";
import PushToggle from "@/components/dashboard/PushToggle";
import SubmitButton from "@/components/auth/SubmitButton";
import { markAllRead } from "./actions";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: `${strings.dashboard.inboxTitle} — ${strings.auth.brand}`,
};

export default async function InboxPage() {
  const items = await getInbox();
  const unread = items.filter((n) => n.read_at === null).length;
  const d = strings.dashboard;

  // بلا مفتاح VAPID لا اشتراك ممكن — نُخفي البطاقة بدل أن نعد بما لا يعمل.
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-ink-line pb-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-display text-xl text-parchment sm:text-2xl">{d.inboxTitle}</h1>
          {unread > 0 && (
            <span className="rounded-full border border-gold/45 px-3 py-0.5 text-xs text-gold-light">
              {d.inboxUnreadLabel} · {unread}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-parchment/60">{d.inboxSubtitle}</p>

        {unread > 0 && (
          <form action={markAllRead} className="mt-4">
            <SubmitButton
              idleLabel={d.inboxMarkAll}
              pendingLabel={d.inboxMarking}
              className="text-sm"
            />
          </form>
        )}
      </header>

      {vapidPublicKey && <PushToggle vapidPublicKey={vapidPublicKey} />}

      <InboxList items={items} />
    </div>
  );
}
