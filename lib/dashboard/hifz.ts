// مساعدات لوحة العضو — تعيين حالات الحصص على ألوان/رموز، وتنسيق المدى والتواريخ.
// كل الأرقام غربية (0-9) بحسب تفضيل النادي.
import type { HifzProgress, SessionStatus } from "@/lib/types/database";

// ترتيب الحالات في الدليل والعرض
export const STATUS_ORDER: SessionStatus[] = ["green", "red", "absent", "excused", "pending"];

// لكل حالة: رمز (لمن لا يميّز الألوان)، وأصناف Tailwind للخلية والنص والنقطة.
export const statusMeta: Record<
  SessionStatus,
  { glyph: string; cell: string; text: string; dot: string }
> = {
  green: { glyph: "✓", cell: "border-tick-green/70 bg-tick-green/15", text: "text-tick-green", dot: "bg-tick-green" },
  red: { glyph: "✕", cell: "border-tick-red/70 bg-tick-red/15", text: "text-tick-red", dot: "bg-tick-red" },
  absent: { glyph: "○", cell: "border-tick-absent/70 bg-tick-absent/15", text: "text-tick-absent", dot: "bg-tick-absent" },
  excused: { glyph: "◑", cell: "border-tick-excused/70 bg-tick-excused/15", text: "text-tick-excused", dot: "bg-tick-excused" },
  pending: { glyph: "•", cell: "border-ink-line bg-ink-soft/40", text: "text-parchment/45", dot: "bg-parchment/30" },
};

type RangeLike = {
  from_surah: number | null;
  from_ayah: number | null;
  to_surah: number | null;
  to_ayah: number | null;
};

// «البقرة 5–20» داخل سورة، أو «البقرة 280 — آل عمران 10» عبر سورتين.
export function formatRange(r: RangeLike, surahs: Record<number, string>): string | null {
  if (!r.from_surah) return null;
  const fn = surahs[r.from_surah] ?? `#${r.from_surah}`;
  const fa = r.from_ayah ?? 1;
  if (r.to_surah && r.to_surah !== r.from_surah) {
    const tn = surahs[r.to_surah] ?? `#${r.to_surah}`;
    return `${fn} ${fa} — ${tn} ${r.to_ayah ?? ""}`.trim();
  }
  if (r.to_ayah && r.to_ayah !== fa) return `${fn} ${fa}–${r.to_ayah}`;
  return `${fn} ${fa}`;
}

// نسبة الحفظ من المصحف — تعتمد الصفحات (من 604) وإلا الأجزاء (من 30).
export function progressPercent(p: HifzProgress | null): number {
  if (!p) return 0;
  if (p.memorized_pages != null) return Math.min(100, Math.round((p.memorized_pages / 604) * 100));
  if (p.memorized_juz != null) return Math.min(100, Math.round((Number(p.memorized_juz) / 30) * 100));
  return 0;
}

// تاريخ عربي بأرقام غربية، بتوقيت الدار البيضاء.
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ar-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Casablanca",
  }).format(new Date(iso));
}

// عدد الأيام حتى تاريخ (بحساب الأيام التقويمية في الدار البيضاء).
export function daysUntil(dateStr: string): number {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Casablanca" });
  const a = Date.parse(today + "T00:00:00Z");
  const b = Date.parse(dateStr.slice(0, 10) + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}
