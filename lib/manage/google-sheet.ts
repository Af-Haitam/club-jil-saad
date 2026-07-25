// دفع قائمة الأعضاء إلى جدول Google — عبر Apps Script منشور كتطبيق وِب.
// الإعداد في docs/google-sheet.md. بلا متغيّرات البيئة يبقى الزر مخفيًا.
import { getMembers, getHalaqat, getEnrollments, getProgress } from "@/lib/manage/queries";
import { strings } from "@/lib/strings";
import { surahs } from "@/lib/quran/surahs";

const m = strings.manage;

const roleLabel = { admin: m.roleAdmin, supervisor: m.roleSupervisor, member: m.roleMember } as const;
const statusLabel = { active: m.stActive, pending: m.stPending, suspended: m.stSuspended } as const;

const header = [
  m.colName,
  m.colContact,
  m.colEmail,
  m.colRole,
  m.fStatus,
  m.mHifz,
  m.mClub,
  m.colHalaqa,
  m.colDay,
  m.fTime,
  m.fAmount,
  m.pSurah,
  m.pAyah,
  m.pPages,
  m.pJuz,
];

/** إعدادات الجدول من البيئة. `configured` تعني أنّ الدفع ممكن أصلًا. */
export function sheetConfig() {
  const webhook = process.env.GOOGLE_SHEET_WEBHOOK_URL?.trim() ?? "";
  const token = process.env.GOOGLE_SHEET_TOKEN?.trim() ?? "";
  const url = process.env.GOOGLE_SHEET_URL?.trim() ?? "";
  return { webhook, token, url, configured: Boolean(webhook && token) };
}

/**
 * صفّ العنوان ثمّ صفّ لكل عضو — كل القيم نصوص.
 * الأرقام تُترك نصًّا عمدًا: «0600000000» لو أُرسل رقمًا لأكلت Sheets صفره الأول.
 */
export async function buildRoster(): Promise<string[][]> {
  const [members, halaqat, enrollments, progress] = await Promise.all([
    getMembers(),
    getHalaqat(),
    getEnrollments(),
    getProgress(),
  ]);

  const halaqaName = new Map(halaqat.map((h) => [h.id, h.name]));
  const memberHalaqa = new Map(enrollments.map((e) => [e.member_id, halaqaName.get(e.halaqa_id) ?? ""]));
  const progressOf = new Map(progress.map((p) => [p.member_id, p]));
  const surahName = new Map(surahs.map((s) => [s.number, s.name_ar]));
  const amountLabel = new Map<number, string>(strings.hifzAmounts.map((a) => [a.value, a.label]));

  const rows = members.map((p) => {
    const prog = progressOf.get(p.id);
    return [
      p.full_name,
      p.phone ?? "",
      p.email ?? "",
      roleLabel[p.role],
      statusLabel[p.status],
      p.in_hifz ? "✓" : "",
      p.in_club ? "✓" : "",
      memberHalaqa.get(p.id) ?? "",
      p.session_day === null ? "" : strings.weekdays[p.session_day],
      p.session_time?.slice(0, 5) ?? "",
      p.weekly_amount === null ? "" : amountLabel.get(p.weekly_amount) ?? "",
      prog?.current_surah == null ? "" : surahName.get(prog.current_surah) ?? "",
      prog?.current_ayah == null ? "" : String(prog.current_ayah),
      prog?.memorized_pages == null ? "" : String(prog.memorized_pages),
      prog?.memorized_juz == null ? "" : String(prog.memorized_juz),
    ];
  });

  return [header, ...rows];
}

export type PushResult = { ok: true; count: number } | { ok: false; reason: "unconfigured" | "failed" };

/** يستبدل محتوى الجدول بالقائمة الحالية. الأعضاء تحت RLS، فالمشرف يدفع طلبته فقط. */
export async function pushRoster(): Promise<PushResult> {
  const { webhook, token, configured } = sheetConfig();
  if (!configured) return { ok: false, reason: "unconfigured" };

  const rows = await buildRoster();

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, rows }),
      // Apps Script قد يبرد ويتأخّر؛ نقطع قبل أن تقطع Vercel علينا.
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, reason: "failed" };
    const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    if (!data?.ok) return { ok: false, reason: "failed" };
    return { ok: true, count: rows.length - 1 };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
