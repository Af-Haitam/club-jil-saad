// قراءة بيانات العضو — مرآة `web/lib/dashboard/queries.ts`.
//
// نفس الاستعلامات حرفًا تقريبًا، والفارق الوحيد أنّ العميل هنا عميل الجهاز
// لا عميل الخادم. RLS هي التي تحمي، وهي نفسها في الحالتين — فلا يمكن لهذا
// التطبيق أن يقرأ ما لا يقرؤه الموقع.
import { supabase } from "./supabase";

export type Cycle = {
  id: string;
  name: string | null;
  week_count: number;
  start_date: string | null;
};

export type Session = {
  id: string;
  week_number: number;
  status: "green" | "red" | "absent" | "excused" | "pending";
  surah_number: number | null;
  ayah_from: number | null;
  ayah_to: number | null;
  mistakes: number | null;
  notes: string | null;
  scheduled_date: string | null;
};

export type Progress = {
  surah_number: number | null;
  ayah_number: number | null;
  juz_count: number | null;
  pages_count: number | null;
};

export type Exam = {
  id: string;
  title: string | null;
  exam_date: string | null;
  place: string | null;
};

export type Post = {
  id: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  published_at: string | null;
};

export type Overview = {
  cycle: Cycle | null;
  sessions: Session[];
  progress: Progress | null;
  exam: Exam | null;
  surahs: Record<number, string>;
};

export async function getOverview(userId: string): Promise<Overview> {
  const [cycleRes, surahRes] = await Promise.all([
    supabase
      .from("program_cycles")
      .select("id, name, week_count, start_date")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("quran_surahs").select("number, name_ar"),
  ]);

  const cycle = (cycleRes.data ?? null) as Cycle | null;

  const surahs: Record<number, string> = {};
  for (const row of (surahRes.data ?? []) as { number: number; name_ar: string }[]) {
    surahs[row.number] = row.name_ar;
  }

  const [sessionsRes, progressRes, examRes] = await Promise.all([
    cycle
      ? supabase
          .from("weekly_sessions")
          .select("id, week_number, status, surah_number, ayah_from, ayah_to, mistakes, notes, scheduled_date")
          .eq("member_id", userId)
          .eq("cycle_id", cycle.id)
          .order("week_number", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from("hifz_progress")
      .select("surah_number, ayah_number, juz_count, pages_count")
      .eq("member_id", userId)
      .maybeSingle(),
    supabase
      .from("exams")
      .select("id, title, exam_date, place")
      .eq("status", "upcoming")
      .order("exam_date", { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    cycle,
    sessions: (sessionsRes.data ?? []) as Session[],
    progress: (progressRes.data ?? null) as Progress | null,
    exam: (examRes.data ?? null) as Exam | null,
    surahs,
  };
}

export type Notice = {
  id: string;
  kind: string | null;
  title: string | null;
  body: string | null;
  image_url: string | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
};

export async function getInbox(): Promise<Notice[]> {
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, image_url, url, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Notice[];
}

export async function markAllRead(userId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
