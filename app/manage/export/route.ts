// تصدير قائمة الأعضاء إلى ملف Excel.
// تنبيه: معالِجات المسار (route handlers) لا يلفّها app/manage/layout.tsx،
// فبوّابة الدور هنا هي الوحيدة التي تحمي الملف — لا تحذفها.
import ExcelJS from "exceljs";
import { getAdminProfile, getMembers, getHalaqat, getEnrollments, getProgress } from "@/lib/manage/queries";
import { strings } from "@/lib/strings";
import { surahs } from "@/lib/quran/surahs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const m = strings.manage;

const roleLabel = { admin: m.roleAdmin, supervisor: m.roleSupervisor, member: m.roleMember } as const;
const statusLabel = { active: m.stActive, pending: m.stPending, suspended: m.stSuspended } as const;

export async function GET() {
  const me = await getAdminProfile();
  if (!me) return new Response(m.errAdminOnly, { status: 403 });

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
  // النوع صريح: hifzAmounts معلَّن as const فمفاتيحه اتحاد حرفي، وweekly_amount عدد عادي.
  const amountLabel = new Map<number, string>(strings.hifzAmounts.map((a) => [a.value, a.label]));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = strings.auth.brand;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(m.membersTitle, { views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: m.colName, key: "name", width: 26 },
    { header: m.colContact, key: "phone", width: 16 },
    { header: "البريد", key: "email", width: 28 },
    { header: m.colRole, key: "role", width: 10 },
    { header: m.fStatus, key: "status", width: 12 },
    { header: m.mHifz, key: "hifz", width: 8 },
    { header: m.mClub, key: "club", width: 8 },
    { header: m.colHalaqa, key: "halaqa", width: 18 },
    { header: m.colDay, key: "day", width: 10 },
    { header: m.fTime, key: "time", width: 9 },
    { header: m.fAmount, key: "amount", width: 14 },
    { header: m.pSurah, key: "surah", width: 14 },
    { header: m.pAyah, key: "ayah", width: 8 },
    { header: m.pPages, key: "pages", width: 14 },
    { header: m.pJuz, key: "juz", width: 14 },
  ];

  for (const p of members) {
    const prog = progressOf.get(p.id);
    sheet.addRow({
      name: p.full_name,
      phone: p.phone ?? "",
      email: p.email ?? "",
      role: roleLabel[p.role],
      status: statusLabel[p.status],
      hifz: p.in_hifz ? "✓" : "",
      club: p.in_club ? "✓" : "",
      halaqa: memberHalaqa.get(p.id) ?? "",
      day: p.session_day === null ? "" : strings.weekdays[p.session_day],
      time: p.session_time?.slice(0, 5) ?? "",
      amount: p.weekly_amount === null ? "" : amountLabel.get(p.weekly_amount) ?? "",
      surah: prog?.current_surah == null ? "" : surahName.get(prog.current_surah) ?? "",
      ayah: prog?.current_ayah ?? "",
      pages: prog?.memorized_pages ?? "",
      juz: prog?.memorized_juz ?? "",
    });
  }

  sheet.eachRow((row) => {
    row.font = { name: "Arial", size: 11 };
    row.alignment = { vertical: "middle", readingOrder: "rtl" };
  });
  const header = sheet.getRow(1);
  header.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF1C1A17" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9A441" } };
  header.height = 22;

  const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());
  const stamp = new Date().toISOString().slice(0, 10);
  const arabicName = encodeURIComponent(`أعضاء-نادي-الجيل-الصاعد-${stamp}.xlsx`);

  return new Response(bytes, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // اسم ASCII احتياطي أولًا، ثم الاسم العربي بترميز RFC 5987 للمتصفّحات الحديثة.
      "content-disposition": `attachment; filename="members-${stamp}.xlsx"; filename*=UTF-8''${arabicName}`,
      "cache-control": "no-store",
    },
  });
}
