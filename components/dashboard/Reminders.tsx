import type { Reminder } from "@/lib/types/database";
import { formatDate } from "@/lib/dashboard/hifz";
import { strings } from "@/lib/strings";

export default function Reminders({ items }: { items: Reminder[] }) {
  if (items.length === 0) return null; // لا قسم إن لم توجد تذكيرات

  return (
    <section className="rounded-xl border border-ink-line bg-ink-soft/40 p-6">
      <h2 className="mb-4 font-bold text-lg text-gold-light">{strings.manage.remindersHeading}</h2>
      <ul className="flex flex-col gap-5">
        {items.map((r) => (
          <li key={r.id} className="border-b border-ink-line/60 pb-5 last:border-0 last:pb-0">
            <p className="font-bold text-parchment">{r.title}</p>
            {r.body && <p className="mt-1 text-sm leading-7 text-parchment/70">{r.body}</p>}
            {r.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.image_url}
                alt=""
                className="mt-3 max-h-72 w-full rounded-md border border-ink-line object-cover"
              />
            )}
            {r.published_at && <p className="mt-2 text-xs text-parchment/45">{formatDate(r.published_at)}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
