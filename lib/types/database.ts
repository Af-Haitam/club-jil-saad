// أنواع قاعدة البيانات — مرآة لمخطط Supabase (supabase/migrations/0001_init.sql)
// Database types — hand-mirrored from the SQL schema. Columns stay snake_case
// because that is exactly what Supabase returns.

export type UserRole = "admin" | "supervisor" | "member";
export type UserStatus = "pending" | "active" | "suspended";
export type SessionStatus = "pending" | "green" | "red" | "absent" | "excused";
export type ExamScope = "member" | "halaqa" | "all";
export type ExamStatus = "upcoming" | "done" | "cancelled";
export type AudienceType = "hifz" | "club" | "both" | "halaqa" | "member";
export type PushPlatform = "web" | "android" | "ios";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  in_hifz: boolean;
  in_club: boolean;
  session_day: number | null; // 0=الأحد … 6=السبت
  session_time: string | null; // "HH:MM"
  weekly_amount: number | null; // 1..8 أثمان الحزب
  joined_at: string;
  created_at: string;
  updated_at: string;
}

// What the registration form sends as auth metadata (options.data on signUp).
// Keys MUST match handle_new_user() in the SQL, or the values are silently dropped.
// NOTE: role & status are NOT here — they are forced server-side. Never send them.
export interface SignupMetadata {
  full_name: string;
  phone?: string;
  city?: string;
  in_club: boolean;
  session_day?: number;
  session_time?: string;
  weekly_amount?: number;
}

export interface Surah {
  number: number;
  name_ar: string;
  ayah_count: number;
  page_start: number | null;
  juz: number | null;
}

export interface ProgramCycle {
  id: string;
  name: string;
  start_date: string | null;
  week_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Halaqa {
  id: string;
  name: string;
  supervisor_id: string | null;
  schedule_note: string | null;
  capacity: number | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  member_id: string;
  halaqa_id: string;
  started_at: string;
  active: boolean;
}

export interface HifzProgress {
  id: string;
  member_id: string;
  current_surah: number | null;
  current_ayah: number | null;
  memorized_pages: number | null;
  memorized_juz: number | null;
  last_updated_by: string | null;
  updated_at: string;
}

export interface WeeklySession {
  id: string;
  member_id: string;
  supervisor_id: string | null;
  cycle_id: string;
  week_number: number;
  week_start: string | null;
  scheduled_date: string | null;
  status: SessionStatus;
  from_surah: number | null;
  from_ayah: number | null;
  to_surah: number | null;
  to_ayah: number | null;
  hizb_number: number | null;
  mistakes_count: number | null;
  notes: string | null;
  evaluated_by: string | null;
  evaluated_at: string | null;
  created_at: string;
}

export interface Exam {
  id: string;
  scope: ExamScope;
  member_id: string | null;
  halaqa_id: string | null;
  title: string;
  exam_date: string | null;
  exam_time: string | null;
  location: string | null;
  from_surah: number | null;
  from_ayah: number | null;
  to_surah: number | null;
  to_ayah: number | null;
  status: ExamStatus;
  result_grade: string | null;
  result_notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  author_id: string | null;
  audience_type: AudienceType;
  halaqa_id: string | null;
  member_id: string | null;
  published_at: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  author_id: string | null;
  audience_type: AudienceType;
  halaqa_id: string | null;
  member_id: string | null;
  published_at: string | null;
  created_at: string;
}

// نسخة المستخدم من الرسالة. تحمل عنوانها ونصّها بنفسها (0005) لأن رسائل
// المهمّة اليومية لا مصدر لها في جدول آخر — فقراءة الصندوق استعلام واحد.
export type NotificationKind = "announcement" | "reminder" | "system" | "question";

export interface AppNotification {
  id: string;
  user_id: string;
  kind: NotificationKind;
  announcement_id: string | null;
  reminder_id: string | null;
  title: string | null;
  body: string | null;
  image_url: string | null;
  url: string | null;
  dedupe_key: string | null;
  read_at: string | null;
  created_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string; // endpoint الاشتراك — فريد
  platform: PushPlatform;
  keys: { p256dh: string; auth: string } | null;
  last_used_at: string | null;
  created_at: string;
}
