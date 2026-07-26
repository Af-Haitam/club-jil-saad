// قائمة صندوق الإشعارات. مكوّن خادم بالكامل — لا تفاعل فيه سوى زرّ واحد
// داخل <form action>، فلا داعي لإرسال أيّ JavaScript من أجله.
import type { AppNotification, NotificationKind } from "@/lib/types/database";
import { formatDate } from "@/lib/dashboard/hifz";
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
      <p className="rounded-xl border border-dashed border-ink-line bg-ink-soft/30 px-6 py-10 text-center text-parchment/60">
        {d.inboxNone}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((n) => {
        const unread = n.read_at === null;
        const style = kindStyle[n.kind] ?? kindStyle.announcement;

        return (
          <li
            key={n.id}
            // الحدّ على حافة البداية (ps/border-s) لا اليسار — منطقيّ فيحترم RTL.
            className={`rounded-xl border border-s-2 bg-ink-soft/40 p-5 transition-colors ${
              unread ? "border-s-gold border-ink-line/80" : "border-s-ink-line border-ink-line/50"
            }`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2.5">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs ${style.chip}`}>
                {style.label}
              </span>
              {unread && (
                <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-medium text-ink">
                  {d.inboxNew}
                </span>
              )}
              <span className="ms-auto text-xs text-parchment/45">{formatDate(n.created_at)}</span>
            </div>

            <p className={`font-bold ${unread ? "text-gold-light" : "text-parchment/85"}`}>
              {n.title}
            </p>
            {n.body && (
              <p className="mt-1.5 whitespace-pre-line text-sm leading-7 text-parchment/70">
                {n.body}
              </p>
            )}
            {n.image_url && (
              // صور المحتوى تأتي من دلو Supabase بأبعاد غير معروفة مسبقًا،
              // فـ next/image بلا fill أو أبعاد لا يصلح هنا.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={n.image_url}
                alt=""
                loading="lazy"
                className="mt-3 max-h-72 w-full rounded-md border border-ink-line object-cover"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
