import type { Reminder } from "@/lib/types/database";
import PostCard from "@/components/dashboard/PostCard";
import { strings } from "@/lib/strings";

export default function Reminders({ items }: { items: Reminder[] }) {
  if (items.length === 0) return null; // لا قسم إن لم توجد تذكيرات

  return (
    <section>
      <h2 className="mb-4 font-display text-lg text-gold-light">
        {strings.manage.remindersHeading}
      </h2>
      <div className="flex flex-col gap-5">
        {items.map((r) => (
          <PostCard
            key={r.id}
            title={r.title}
            body={r.body}
            imageUrl={r.image_url}
            date={r.published_at}
          />
        ))}
      </div>
    </section>
  );
}
