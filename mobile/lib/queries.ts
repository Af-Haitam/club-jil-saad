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
  from_surah: number | null;
  from_ayah: number | null;
  to_ayah: number | null;
  mistakes_count: number | null;
  notes: string | null;
  scheduled_date: string | null;
};

export type Progress = {
  current_surah: number | null;
  current_ayah: number | null;
  memorized_juz: number | null;
  memorized_pages: number | null;
};

export type Exam = {
  id: string;
  title: string | null;
  exam_date: string | null;
  exam_time: string | null;
  location: string | null;
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

  if (cycleRes.error) throw new Error(JSON.stringify(cycleRes.error));
  const cycle = (cycleRes.data ?? null) as Cycle | null;

  const surahs: Record<number, string> = {};
  for (const row of (surahRes.data ?? []) as { number: number; name_ar: string }[]) {
    surahs[row.number] = row.name_ar;
  }

  const [sessionsRes, progressRes, examRes] = await Promise.all([
    cycle
      ? supabase
          .from("weekly_sessions")
          .select("id, week_number, status, from_surah, from_ayah, to_ayah, mistakes_count, notes, scheduled_date")
          .eq("member_id", userId)
          .eq("cycle_id", cycle.id)
          .order("week_number", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from("hifz_progress")
      .select("current_surah, current_ayah, memorized_juz, memorized_pages")
      .eq("member_id", userId)
      .maybeSingle(),
    supabase
      .from("exams")
      .select("id, title, exam_date, exam_time, location")
      .eq("status", "upcoming")
      .order("exam_date", { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // اسم عمودٍ خاطئ يجعل PostgREST يرفض الاستعلام كلّه ويعيد data = null،
  // و`?? []` كان يحوّل ذلك إلى شبكةٍ فارغة **تُشبه تمامًا** «لم تُسجَّل حصص
  // بعد». ثلاثة استعلامات كانت مكسورة بهذا الشكل ولم يشتكِ شيء. فليصرخ.
  for (const r of [sessionsRes, progressRes, examRes] as { error?: unknown }[]) {
    if (r.error) throw new Error(JSON.stringify(r.error));
  }

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

export type FeedItem = {
  key: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  at: string;
  unread: boolean;
};

/**
 * ما يراه العضو في صندوقه.
 *
 * **ليست جدول `notifications` وحده**، وهذا فرقٌ يهمّ: التوزيع يحدث لحظة
 * النشر، فمن انضمّ إلى النادي اليوم لا يملك أيّ إشعارٍ عن إعلانات الأمس —
 * وكان صندوقه سيظهر فارغًا بينما الموقع يعرض له كلّ شيء.
 *
 * فنقرأ الثلاثة معًا: الإشعارات (وهي وحدها تحمل «مقروء/غير مقروء»، وفيها
 * رسائل المهمّة اليومية التي لا صفّ لها في أيّ جدول)، ثمّ الإعلانات
 * والتذكيرات — ويُسقط المكرَّر منها بمعرّف مصدره.
 *
 * إعلانٌ بلا إشعارٍ **لا يُعلَّم «جديد»**: العضو لم يُنبَّه إليه أصلًا،
 * ووسمُه جديدًا شارةٌ لا تنطفئ أبدًا.
 */
export async function getFeed(): Promise<FeedItem[]> {
  const [noticeRes, annRes, remRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, announcement_id, reminder_id, title, body, image_url, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("announcements")
      .select("id, title, body, image_url, published_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(30),
    supabase
      .from("reminders")
      .select("id, title, body, image_url, published_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(20),
  ]);

  for (const r of [noticeRes, annRes, remRes] as { error?: unknown }[]) {
    if (r.error) throw new Error(JSON.stringify(r.error));
  }

  const items = new Map<string, FeedItem>();

  type NoticeRow = {
    id: string;
    announcement_id: string | null;
    reminder_id: string | null;
    title: string | null;
    body: string | null;
    image_url: string | null;
    read_at: string | null;
    created_at: string;
  };

  for (const n of (noticeRes.data ?? []) as NoticeRow[]) {
    const key = n.announcement_id
      ? `a:${n.announcement_id}`
      : n.reminder_id
        ? `r:${n.reminder_id}`
        : `n:${n.id}`;
    items.set(key, {
      key,
      title: n.title,
      body: n.body,
      image_url: n.image_url,
      at: n.created_at,
      unread: !n.read_at,
    });
  }

  type PostRow = {
    id: string;
    title: string | null;
    body: string | null;
    image_url: string | null;
    published_at: string;
  };

  const addPosts = (rows: PostRow[], prefix: "a" | "r") => {
    for (const p of rows) {
      const key = `${prefix}:${p.id}`;
      if (items.has(key)) continue;
      items.set(key, {
        key,
        title: p.title,
        body: p.body,
        image_url: p.image_url,
        at: p.published_at,
        unread: false,
      });
    }
  };

  addPosts((annRes.data ?? []) as PostRow[], "a");
  addPosts((remRes.data ?? []) as PostRow[], "r");

  return [...items.values()].sort((x, y) => (x.at < y.at ? 1 : -1));
}

export async function markAllRead(userId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
