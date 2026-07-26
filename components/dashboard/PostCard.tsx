import type { ReactNode } from "react";

import { formatDate } from "@/lib/dashboard/hifz";

/**
 * بطاقة منشور — إعلان أو تذكير أو رسالة من النادي.
 *
 * الصورة تملأ عرض البطاقة إلى حوافّها (لذلك overflow-hidden على الحاوية:
 * هي ما يقصّ الصورة عند الزوايا الدائرية)، ثم تهبط إلى لوح الحبر فيبدأ
 * النصّ. الترتيب مقصود: الصورة أوّلًا لأنها ما يوقف العين، ثم التاريخ
 * سطرًا ذهبيًّا صغيرًا، ثم العنوان بالخطّ الكوفي.
 *
 * النسبة 3:2 لا 16:9، وهي مقيسة على صور النادي الفعلية: وجدناها 4:3 و3:2
 * (كاميرات الهواتف)، فصندوق 16:9 كان يترك شريطَي حبرٍ بعرض ٤٢ بكسل على
 * الجانبين — أي أن الصورة لا تلامس حافّة البطاقة أصلًا، وهو نقيض المطلوب.
 * 3:2 وسطٌ يملأ العرض دائمًا وأقصى قصٍّ فيه نحو السدس.
 *
 * والنسبة ثابتة (لا `h-auto`) كي لا يقفز ما تحتها حين تصل الصورة.
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
      className={`overflow-hidden rounded-2xl border bg-ink-soft/40 ${
        accent ? "border-ink-line border-s-2 border-s-gold" : "border-ink-line"
      }`}
    >
      {imageUrl && (
        // أبعاد الصور غير معروفة مسبقًا (رفع المدير)، فلا تصلح next/image بلا fill
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="aspect-3/2 w-full bg-ink object-cover"
        />
      )}

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {date && (
            <time dateTime={date} className="text-xs tracking-widest text-gold/75">
              {formatDate(date)}
            </time>
          )}
          {chips && <div className="ms-auto flex flex-wrap items-center gap-2">{chips}</div>}
        </div>

        <h3 className="mt-3 font-display text-lg leading-[1.7] text-gold-light sm:text-xl">
          {title}
        </h3>

        {body && (
          <p className="mt-2 whitespace-pre-line text-sm leading-8 text-parchment/75">{body}</p>
        )}
      </div>
    </article>
  );
}
