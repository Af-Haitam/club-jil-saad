"use client";

import { motion } from "framer-motion";
import { tracking } from "@/lib/site-content";
import { strings, arabicDigits } from "@/lib/strings";

const c = tracking.content;

/* اللون وحده لا يكفي (عمى الألوان) — رمز داخل كل خلية يحمل المعنى أيضًا */
const cellKinds = {
  g: { bg: "bg-tick-green", glyph: "✓", label: strings.tracking.cellG },
  r: { bg: "bg-tick-red", glyph: "✕", label: strings.tracking.cellR },
} as const;

type CellKind = keyof typeof cellKinds;

function Cell({
  kind,
  delay,
  label,
}: {
  kind: CellKind;
  delay: number;
  label: string;
}) {
  const s = cellKinds[kind];
  return (
    <motion.div
      role="img"
      aria-label={label}
      className={`m-init flex h-7 w-full items-center justify-center text-xs text-parchment ${s.bg}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      style={{ originX: 1 }} /* يمتلئ من اليمين — اتجاه القراءة */
    >
      <span aria-hidden="true">{s.glyph}</span>
    </motion.div>
  );
}

/**
 * نسخة حيّة من جدول تتبّع النادي الحقيقي: أسابيع الدورة ثم الاختبار،
 * تمتلئ الخلايا عند دخولها مجال الرؤية. الأسماء رمزية —
 * لا تُعرض أسماء الطلبة الحقيقية.
 */
export default function TrackingGrid() {
  const weekNums = Array.from({ length: c.weeks }, (_, i) =>
    arabicDigits(i + 1),
  );

  return (
    <div className="overflow-x-auto" dir="rtl">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">{strings.tracking.caption}</caption>
        <thead>
          <tr className="bg-navy text-parchment">
            <th scope="col" className="border border-navy/40 px-3 py-2 font-medium">
              {c.columns.name}
            </th>
            <th scope="col" className="border border-navy/40 px-3 py-2 font-medium">
              {c.columns.amount}
            </th>
            {weekNums.map((n) => (
              <th
                scope="col"
                key={n}
                className="border border-navy/40 px-2 py-2 font-normal whitespace-nowrap"
              >
                {c.columns.weekPrefix} {n}
              </th>
            ))}
            <th scope="col" className="border border-navy/40 px-3 py-2 font-medium">
              {c.columns.exam}
            </th>
          </tr>
        </thead>
        <tbody>
          {c.rows.map((row, ri) => (
            <tr key={row.name} className="bg-parchment/70">
              <td className="border border-navy/20 px-3 py-2 whitespace-nowrap text-navy">
                {row.name}
              </td>
              <td className="border border-navy/20 px-3 py-2 text-center text-navy/80">
                {row.amount}
              </td>
              {row.cells.map((cell, ci) => (
                <td key={ci} className="border border-navy/20 p-1">
                  <Cell
                    kind={cell as CellKind}
                    delay={0.15 + ci * 0.12 + ri * 0.05}
                    label={`${c.columns.weekPrefix} ${weekNums[ci]}: ${cellKinds[cell as CellKind].label}`}
                  />
                </td>
              ))}
              <td className="border border-navy/20 p-1">
                <Cell
                  kind={row.exam as CellKind}
                  delay={0.15 + c.weeks * 0.12 + ri * 0.05}
                  label={`${c.columns.exam}: ${cellKinds[row.exam as CellKind].label}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
