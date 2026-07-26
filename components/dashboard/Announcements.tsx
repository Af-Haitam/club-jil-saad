import type { Announcement } from "@/lib/types/database";
import PostCard from "@/components/dashboard/PostCard";
import { strings } from "@/lib/strings";

export default function Announcements({ items }: { items: Announcement[] }) {
  const d = strings.dashboard;

  return (
    <section>
      <h2 className="mb-4 font-display text-lg text-gold-light">{d.annTitle}</h2>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/30 px-6 py-8 text-center text-parchment/55">
          {d.annNone}
        </p>
      ) : (
        // البطاقات نفسها هي الإطار — لا صندوق حولها، وإلّا صار إطارٌ داخل إطار.
        <div className="flex flex-col gap-5">
          {items.map((a) => (
            <PostCard
              key={a.id}
              title={a.title}
              body={a.body}
              imageUrl={a.image_url}
              date={a.published_at}
            />
          ))}
        </div>
      )}
    </section>
  );
}
