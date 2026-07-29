// سجلّ الأعطال — مكوّن خادم، لا تفاعل فيه.
//
// وجوده هو الفائدة: أعطال هذا المشروع كانت كلّها صامتة، تُكتشف بالمصادفة
// بعد أيّام. صفٌّ واحدٌ هنا أنفع من عشر شاشات.
import type { ErrorRow } from "@/lib/ops/log";
import { strings } from "@/lib/strings";

const m = strings.manage;

/** لكلّ مصدرٍ لونه — العين تفرز قبل أن تقرأ. */
const sourceStyle: Record<string, string> = {
  cron: "border-tick-excused/50 text-tick-excused",
  push: "border-gold/45 text-gold-light",
  action: "border-tick-absent/50 text-tick-absent",
  server: "border-tick-red/50 text-tick-red",
};

export default function ErrorLog({ rows, ready }: { rows: ErrorRow[]; ready: boolean }) {
  if (!ready) {
    return (
      <p className="rounded-lg border border-dashed border-gold/30 p-4 text-sm text-parchment/55">
        {m.errorsPending}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-tick-green/35 bg-tick-green/8 p-4 text-sm text-tick-green">
        {m.errorsNone}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="rounded-lg border border-ink-line bg-ink-soft/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-sm border px-2 py-0.5 text-[11px] ${
                sourceStyle[r.source] ?? "border-ink-line text-parchment/60"
              }`}
            >
              {r.source}
            </span>
            <time dateTime={r.at} className="text-xs text-parchment/50">
              {formatWhen(r.at)}
            </time>
          </div>
          <p className="mt-2 text-sm leading-7 text-parchment/85">{r.message}</p>
          {r.detail && (
            // التفصيل مطويّ: نافعٌ حين يُبحث عن سبب، ومزعجٌ حين تُقرأ القائمة
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-parchment/50 hover:text-gold">
                {r.source}
              </summary>
              <pre
                dir="ltr"
                className="mt-2 max-h-52 overflow-auto rounded-md bg-ink p-3 text-start text-[11px] leading-5 text-parchment/60"
              >
                {r.detail}
              </pre>
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}

/** أرقام غربية وشهرٌ عربيّ — نفس صيغة بقيّة الموقع. */
function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-MA-u-nu-latn", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Casablanca",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
