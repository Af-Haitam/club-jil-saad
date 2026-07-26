import type { ReactNode } from "react";

import { formatDate } from "@/lib/dashboard/hifz";

/**
 * بطاقة منشور — إعلان أو تذكير أو رسالة من النادي.
 *
 * الفكرة: زجاجٌ ذهبيّ فوق ماء. الصورة تملأ أعلى البطاقة حادّةً، ثم يهبط
 * عليها لوحٌ شفيف يحمل النصّ — و**اللوح يستمدّ لونه من الصورة نفسها**: نسخة
 * ممدودة منها تقف خلفه، وbackdrop-blur يميّعها. فلكلّ إعلانٍ زجاجُه: صورة
 * غروبٍ تصبغ اللوح بالبرتقالي، وصورة سماءٍ تصبغه بالأزرق، بلا سطر إضافي.
 *
 * `isolate` ليس زينة: هو ما يحصر ما يلتقطه الضبابُ داخل البطاقة، وإلّا
 * التقط الصفحة من خلفها.
 *
 * الصورة الحادّة بنسبة 3:2 و`object-cover`، وهي مقيسة على صور النادي
 * الفعلية (4:3 و3:2 من كاميرات الهواتف): صندوق 16:9 كان يترك شريطَي حبرٍ
 * على الجانبين فلا تلامس الصورة الحافّة. والنسبة ثابتة كي لا يقفز ما تحتها
 * حين تصل الصورة.
 */
export default function PostCard({
  title,
  body,
  imageUrl,
  date,
  chips,
  accent = false,
}: {
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  date: string | null;
  /** شارات تُعرض في طرف سطر التاريخ (النوع، «جديد»…). */
  chips?: ReactNode;
  /** حدّ ذهبي على حافة البداية — للمنشور غير المقروء. */
  accent?: boolean;
}) {
  return (
    <article
      className={`relative isolate overflow-hidden rounded-2xl border bg-ink-soft/50 shadow-lg shadow-black/40 ${
        accent ? "border-gold/30 border-s-2 border-s-gold" : "border-gold/20"
      }`}
    >
      {imageUrl && (
        <>
          {/* الماء: نسخة ممدودة من الصورة تقف خلف اللوح ليلتقط لونها */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full scale-125 object-cover opacity-80 saturate-150"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="relative aspect-3/2 w-full object-cover"
          />
        </>
      )}

      <div
        className={`relative p-5 backdrop-blur-xl sm:p-6 ${
          imageUrl
            ? // 75% لا 70%: خلف الزجاج قد تقف سماءٌ بيضاء، وعندها يهبط تباين
              // السطر الذهبي الصغير تحت الحدّ المقروء. هذه النسبة تُبقي الماء
              // ظاهرًا وتُنجّي أصغر نصّ في البطاقة.
              "bg-ink/75"
            : // بلا صورة لا ماء يُرى، فالذهب نفسه هو ما يلوّن الزجاج
              "bg-linear-to-b from-gold/12 to-ink-soft/40"
        }`}
      >
        {/* لمعة على حافّة الزجاج العليا — الضوء يقع على الحرف، لا على السطح */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-l from-transparent via-gold/45 to-transparent"
        />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {date && (
            // ذهبٌ فاتح لا غامق: الغامق يسقط تحت الحدّ المقروء فوق صورة
            // ساطعة. التسلسل البصري يقوم على الحجم والتباعد، لا على اللون.
            <time dateTime={date} className="text-xs tracking-widest text-gold-light">
              {formatDate(date)}
            </time>
          )}
          {chips && <div className="ms-auto flex flex-wrap items-center gap-2">{chips}</div>}
        </div>

        <h3 className="mt-3 font-logo text-xl leading-[1.75] text-gold-light sm:text-2xl">
          {title}
        </h3>

        {body && (
          <p className="mt-1.5 whitespace-pre-line text-sm leading-8 text-parchment/80">{body}</p>
        )}
      </div>
    </article>
  );
}
