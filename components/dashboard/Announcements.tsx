import type { Announcement } from "@/lib/types/database";
import { formatDate } from "@/lib/dashboard/hifz";
import { strings } from "@/lib/strings";

export default function Announcements({ items }: { items: Announcement[] }) {
  const d = strings.dashboard;

  return (
    <section className="rounded-xl border border-ink-line bg-ink-soft/40 p-6">
      <h2 className="mb-4 font-bold text-lg text-gold-light">{d.annTitle}</h2>
      {items.length === 0 ? (
        <p className="text-parchment/60">{d.annNone}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((a) => (
            <li key={a.id} className="border-b border-ink-line/60 pb-4 last:border-0 last:pb-0">
              <p className="font-bold text-parchment">{a.title}</p>
              {a.body && <p className="mt-1 text-sm leading-7 text-parchment/70">{a.body}</p>}
              {a.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.image_url}
                  alt=""
                  className="mt-3 max-h-72 w-full rounded-md border border-ink-line object-cover"
                />
              )}
              {a.published_at && (
                <p className="mt-1.5 text-xs text-parchment/45">{formatDate(a.published_at)}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
