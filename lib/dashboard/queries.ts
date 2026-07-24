// طبقة قراءة بيانات لوحة العضو — كلها عبر عميل الخادم المُصادَق، وRLS يضمن أن
// العضو لا يقرأ إلا صفوفه هو. تُستدعى من مكوّنات الخادم فقط.
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  ProgramCycle,
  WeeklySession,
  HifzProgress,
  Exam,
  Announcement,
  Reminder,
} from "@/lib/types/database";

export type DashboardData = {
  profile: Profile;
  cycle: ProgramCycle | null;
  sessions: WeeklySession[];
  progress: HifzProgress | null;
  exam: Exam | null;
  announcements: Announcement[];
  reminders: Reminder[];
  surahs: Record<number, string>;
};

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, cycleRes, surahRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("program_cycles")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("quran_surahs").select("number, name_ar"),
  ]);

  const profile = profileRes.data as Profile | null;
  if (!profile) return null;
  const cycle = (cycleRes.data ?? null) as ProgramCycle | null;

  const surahs: Record<number, string> = {};
  for (const row of (surahRes.data ?? []) as { number: number; name_ar: string }[]) {
    surahs[row.number] = row.name_ar;
  }

  const [sessionsRes, progressRes, examRes, annRes, remRes] = await Promise.all([
    cycle
      ? supabase
          .from("weekly_sessions")
          .select("*")
          .eq("member_id", user.id)
          .eq("cycle_id", cycle.id)
          .order("week_number", { ascending: true })
      : Promise.resolve({ data: [] as WeeklySession[] }),
    supabase.from("hifz_progress").select("*").eq("member_id", user.id).maybeSingle(),
    supabase
      .from("exams")
      .select("*")
      .eq("status", "upcoming")
      .order("exam_date", { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("announcements")
      .select("*")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(20),
    // reminders: قد لا يكون الجدول موجودًا قبل تشغيل 0003 — يعيد لا شيء بأمان.
    supabase
      .from("reminders")
      .select("*")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(10),
  ]);

  return {
    profile,
    cycle,
    sessions: (sessionsRes.data ?? []) as WeeklySession[],
    progress: (progressRes.data ?? null) as HifzProgress | null,
    exam: (examRes.data ?? null) as Exam | null,
    announcements: (annRes.data ?? []) as Announcement[],
    reminders: (remRes.data ?? []) as Reminder[],
    surahs,
  };
}
