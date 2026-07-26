// المهمّة اليومية — خادم فقط، تعمل بمفتاح الخدمة لأنها بلا جلسة مستخدم.
//
// كل صباح: تفتح حصّة هذا الأسبوع لمن اليوم يومه، تذكّره، تُعطي كل مشرف قائمة
// طلابه، وتنبّه على الاختبارات القريبة.
//
// **كل كتابة هنا لا تُكرَّر (on conflict do nothing)**، لأن Vercel قد يعيد
// تشغيل المهمّة عند فشل عابر — ولا يجوز أن يستيقظ العضو على تذكيرين.
import { createAdminClient } from "@/lib/supabase/admin";
import { pushToUsers } from "@/lib/notify/push";
import { strings } from "@/lib/strings";
import type { Exam, ProgramCycle, Profile } from "@/lib/types/database";

const n = strings.notify;

export interface DailyReport {
  date: string;
  weekday: number;
  weekNumber: number | null;
  /** أعضاء اليوم يومهم — سواء أُرسل إليهم الآن أم كانوا مُرسلًا إليهم سلفًا. */
  membersDue: number;
  supervisorsDue: number;
  examTargets: number;
  /** خانات أُنشئت فعلًا الآن. */
  sessionsOpened: number;
  /** رسائل كُتبت فعلًا الآن — صفر في تشغيلٍ ثانٍ لليوم نفسه، وهذا هو الصواب. */
  noticesWritten: number;
  pushSent: number;
  pushPruned: number;
  skipped?: string;
}

// ─── التاريخ في الدار البيضاء، لا في UTC ────────────────────────────────
// المغرب على UTC+1، وينزل إلى UTC+0 في رمضان. لو حسبنا «اليوم» بـ UTC لجاء
// التذكير ليوم الخميس إلى أهل الأربعاء في ساعات المساء الأولى.
export function casablancaToday(): { iso: string; weekday: number } {
  const iso = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Casablanca" });
  // تفسير النصّ كمنتصف ليل UTC يجعل getUTCDay يعطي يوم ذلك التاريخ بالضبط،
  // بلا أيّ انزياح من منطقة الخادم الزمنية.
  const weekday = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0=الأحد … 6=السبت
  return { iso, weekday };
}

function addDays(iso: string, days: number): string {
  const ms = Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round(
    (Date.parse(`${toISO}T00:00:00Z`) - Date.parse(`${fromISO}T00:00:00Z`)) / 86_400_000,
  );
}

/** رقم أسبوع الدورة الجاري، أو null إن لم تبدأ بعد أو انتهت. */
export function currentWeek(cycle: ProgramCycle, todayISO: string): number | null {
  if (!cycle.start_date) return null;
  const elapsed = daysBetween(cycle.start_date, todayISO);
  if (elapsed < 0) return null;
  const week = Math.floor(elapsed / 7) + 1;
  return week >= 1 && week <= cycle.week_count ? week : null;
}

// "18:00:00" → "18:00" · الفراغ يبقى فراغًا
function shortTime(value: string | null): string | null {
  return value ? value.slice(0, 5) : null;
}

interface PendingNotice {
  user_id: string;
  kind: "system";
  title: string;
  body: string;
  url: string;
  dedupe_key: string;
}

export async function runDailyJob(): Promise<DailyReport> {
  const supabase = createAdminClient();
  const { iso: today, weekday } = casablancaToday();

  const report: DailyReport = {
    date: today,
    weekday,
    weekNumber: null,
    membersDue: 0,
    supervisorsDue: 0,
    examTargets: 0,
    sessionsOpened: 0,
    noticesWritten: 0,
    pushSent: 0,
    pushPruned: 0,
  };

  const notices: PendingNotice[] = [];

  // ─── 1) الدورة النشطة وأسبوعها ────────────────────────────────────────
  const { data: cycleRow } = await supabase
    .from("program_cycles")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const cycle = (cycleRow ?? null) as ProgramCycle | null;
  const weekNumber = cycle ? currentWeek(cycle, today) : null;
  report.weekNumber = weekNumber;

  // ─── 2) من اليوم يومه ─────────────────────────────────────────────────
  const { data: dueRows } = await supabase
    .from("profiles")
    .select("id, full_name, session_time")
    .eq("status", "active")
    .eq("in_hifz", true)
    .eq("session_day", weekday);

  const due = (dueRows ?? []) as Pick<Profile, "id" | "full_name" | "session_time">[];

  if (due.length > 0 && cycle && weekNumber !== null) {
    // خريطة العضو ← مشرفه، من الانخراطات النشطة.
    const memberIds = due.map((m) => m.id);
    const [{ data: enrollRows }, { data: halaqaRows }] = await Promise.all([
      supabase.from("enrollments").select("member_id, halaqa_id").eq("active", true).in("member_id", memberIds),
      supabase.from("halaqat").select("id, supervisor_id"),
    ]);

    const supervisorOfHalaqa = new Map(
      ((halaqaRows ?? []) as { id: string; supervisor_id: string | null }[]).map((h) => [
        h.id,
        h.supervisor_id,
      ]),
    );
    const halaqaOfMember = new Map(
      ((enrollRows ?? []) as { member_id: string; halaqa_id: string }[]).map((e) => [
        e.member_id,
        e.halaqa_id,
      ]),
    );

    // فتح خانة الأسبوع بحالة "لم يحن" — ignoreDuplicates يحمي حصّة قُيّمت
    // بالفعل من أن يمسحها تشغيلٌ ثانٍ.
    const weekStart = cycle.start_date ? addDays(cycle.start_date, (weekNumber - 1) * 7) : null;
    const { data: opened } = await supabase
      .from("weekly_sessions")
      .upsert(
        due.map((m) => ({
          member_id: m.id,
          cycle_id: cycle.id,
          week_number: weekNumber,
          week_start: weekStart,
          scheduled_date: today,
          status: "pending" as const,
          supervisor_id: supervisorOfHalaqa.get(halaqaOfMember.get(m.id) ?? "") ?? null,
        })),
        { onConflict: "member_id,cycle_id,week_number", ignoreDuplicates: true },
      )
      .select("id");
    report.sessionsOpened = opened?.length ?? 0;

    // تذكير كل عضو، بساعته إن كانت مسجّلة.
    for (const member of due) {
      const time = shortTime(member.session_time);
      notices.push({
        user_id: member.id,
        kind: "system",
        title: n.sessionTitle,
        body: time ? n.sessionBodyAt.replace("{time}", time) : n.sessionBody,
        url: "/dashboard",
        dedupe_key: `session:${today}`,
      });
    }
    report.membersDue = due.length;

    // قائمة كل مشرف بطلاب اليوم — رسالة واحدة لا رسالة لكل طالب.
    const bySupervisor = new Map<string, string[]>();
    for (const member of due) {
      const supervisorId = supervisorOfHalaqa.get(halaqaOfMember.get(member.id) ?? "");
      if (!supervisorId) continue;
      const list = bySupervisor.get(supervisorId) ?? [];
      list.push(member.full_name);
      bySupervisor.set(supervisorId, list);
    }
    for (const [supervisorId, names] of bySupervisor) {
      notices.push({
        user_id: supervisorId,
        kind: "system",
        title: n.supervisorTitle,
        body: n.supervisorBody.replace("{names}", names.join("، ")),
        url: "/manage#record",
        dedupe_key: `supervisor:${today}`,
      });
    }
    report.supervisorsDue = bySupervisor.size;
  } else if (due.length > 0) {
    report.skipped = cycle ? "cycle-not-running" : "no-active-cycle";
  }

  // ─── 3) الاختبارات: قبل ثلاثة أيام، وصباح اليوم نفسه ──────────────────
  const inThreeDays = addDays(today, 3);
  const { data: examRows } = await supabase
    .from("exams")
    .select("*")
    .eq("status", "upcoming")
    .in("exam_date", [today, inThreeDays]);

  const exams = (examRows ?? []) as Exam[];
  for (const exam of exams) {
    const recipients = await examRecipients(supabase, exam);
    const isToday = exam.exam_date === today;
    const time = shortTime(exam.exam_time);
    const body = time
      ? n.examAt.replace("{title}", exam.title).replace("{time}", time)
      : exam.location
        ? n.examPlace.replace("{title}", exam.title).replace("{place}", exam.location)
        : exam.title;

    for (const userId of recipients) {
      notices.push({
        user_id: userId,
        kind: "system",
        title: isToday ? n.examTodayTitle : n.examSoonTitle,
        body,
        url: "/dashboard",
        // مفتاح لكل اختبار وكل يوم: تنبيه الثلاثة أيام وتنبيه الصباح
        // رسالتان مختلفتان، ولا تكرار لأيٍّ منهما.
        dedupe_key: `exam:${exam.id}:${today}`,
      });
    }
    report.examTargets += recipients.length;
  }

  // ─── 4) كتابة الصناديق ثم الدفع ───────────────────────────────────────
  // .select() بعد upsert بـ ignoreDuplicates يُعيد الصفوف المُدرجة فعلًا لا
  // المطلوبة — فيصير التقرير صادقًا في التشغيل الثاني بدل أن يدّعي إرسالًا.
  //
  // وهذا ليس تجميلًا للتقرير: **الدفع يُبنى من الصفوف المكتوبة وحدها**. لو
  // بنيناه من قائمة النوايا لاستيقظ العضو على تذكيرين حين يُعيد Vercel
  // تشغيل المهمّة — الصندوق محميّ بالفهرس الفريد، أمّا الهاتف فلا يحميه شيء.
  type WrittenNotice = PendingNotice & { dedupe_key: string };
  let written: WrittenNotice[] = [];
  if (notices.length > 0) {
    const { data } = await supabase
      .from("notifications")
      .upsert(notices, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true })
      .select("user_id, kind, title, body, url, dedupe_key");
    written = (data ?? []) as WrittenNotice[];
    report.noticesWritten = written.length;
  }

  // الدفع يُجمَّع حسب نصّ الرسالة: نداء واحد لكل مجموعة تتلقّى النصّ نفسه.
  //
  // والوسم هو بادئة مفتاح عدم التكرار بلا تاريخ (`session` لا
  // `session:2026-07-26`)، فتذكيرُ اليوم يحلّ محلّ تذكير أمس على شاشة القفل
  // بدل أن يتراكم فوقه — وهو السلوك الصحيح لتذكيرٍ يتكرّر كلّ أسبوع.
  interface Group {
    title: string;
    body: string;
    url: string;
    tag: string;
    users: string[];
  }
  const groups = new Map<string, Group>();
  for (const notice of written) {
    const tag = notice.dedupe_key.split(":")[0];
    const key = `${tag}|${notice.title}|${notice.body}|${notice.url}`;
    const group = groups.get(key) ?? {
      title: notice.title,
      body: notice.body,
      url: notice.url,
      tag,
      users: [],
    };
    group.users.push(notice.user_id);
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    const outcome = await pushToUsers(group.users, {
      title: group.title,
      body: group.body,
      url: group.url,
      tag: group.tag,
    });
    report.pushSent += outcome.sent;
    report.pushPruned += outcome.pruned;
  }

  return report;
}

// من يعنيه هذا الاختبار — نطاقه محفوظ في exams.scope.
async function examRecipients(
  supabase: ReturnType<typeof createAdminClient>,
  exam: Exam,
): Promise<string[]> {
  if (exam.scope === "member") {
    return exam.member_id ? [exam.member_id] : [];
  }

  if (exam.scope === "halaqa") {
    if (!exam.halaqa_id) return [];
    const { data } = await supabase
      .from("enrollments")
      .select("member_id")
      .eq("halaqa_id", exam.halaqa_id)
      .eq("active", true);
    return ((data ?? []) as { member_id: string }[]).map((e) => e.member_id);
  }

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("status", "active")
    .eq("in_hifz", true);
  return ((data ?? []) as { id: string }[]).map((p) => p.id);
}
