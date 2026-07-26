// قائمة صندوق الإشعارات. مكوّن خادم بالكامل — لا تفاعل فيه سوى زرّ واحد
// في الصفحة، فلا داعي لإرسال أيّ جافاسكريبت من أجله.
import type { AppNotification, NotificationKind } from "@/lib/types/database";
import PostCard from "@/components/dashboard/PostCard";
import { strings } from "@/lib/strings";

const d = strings.dashboard;

// كل مجرى ولونه: الإعلان ذهبي (صوت النادي)، التذكير أزرق كخانة «بعذر» في
// جدول التتبع، ورسائل النظام خضراء كخانة «أتقن» — العضو يعرف مصدر الرسالة
// قبل أن يقرأ حرفًا.
const kindStyle: Record<NotificationKind, { label: string; chip: string }> = {
  announcement: { label: d.kindAnnouncement, chip: "border-gold/45 text-gold-light" },
  reminder: { label: d.kindReminder, chip: "border-tick-excused/50 text-tick-excused" },
  system: { label: d.kindSystem, chip: "border-tick-green/50 text-tick-green" },
};

export default function InboxList({ items }: { items: AppNotification[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/30 px-6 py-10 text-center text-parchment/60">
        {d.inboxNone}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {items.map((n) => {
        const unread = n.read_at === null;
        const style = kindStyle[n.kind] ?? kindStyle.announcement;

        return (
          <PostCard
            key={n.id}
            title={n.title}
            body={n.body}
            imageUrl={n.image_url}
            date={n.created_at}
            accent={unread}
            chips={
              <>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs ${style.chip}`}>
                  {style.label}
                </span>
                {unread && (
                  <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-medium text-ink">
                    {d.inboxNew}
                  </span>
                )}
              </>
            }
          />
        );
      })}
    </div>
  );
}
