// طبقة قراءة منطقة الإدارة — للمدير/المشرف. RLS يقصر المشرف على طلبته.
//
// كلّ دالّةٍ هنا تفحص `error` وترمي عليه.
//
// وهذا ليس احتياطًا نظريًّا: استعلامٌ مرفوض في PostgREST يعيد `data = null`،
// و`?? []` تحوّله إلى قائمةٍ فارغة **لا تُفرَّق عن «لا بيانات»**. وقع ذلك
// فعلًا في تطبيق الهاتف — ثلاثة أسماء أعمدةٍ خاطئة أفرغت جدول العضو ولم
// يشتكِ شيء — فحُصِّنت لوحة العضو (`lib/dashboard/queries.ts`) وحُصِّن
// التطبيق، **ونُسيت لوحة الإدارة**. وهي أخطرها: قائمةٌ فارغة هنا تُقرأ
// «لا أعضاء في النادي».
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  ProgramCycle,
  Halaqa,
  Enrollment,
  HifzProgress,
  WeeklySession,
} from "@/lib/types/database";

/** الملف الشخصي للمستخدم إن كان مديرًا أو مشرفًا، وإلا null (لبوّابة /manage). */
export async function getStaffProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // `maybeSingle` لا `single`: الأخيرة تعدّ «لا صفّ» خطأً، فلا يُفرَّق بين
  // مستخدمٍ بلا ملفٍّ شخصيّ (حالةٌ عاديّة) وعطلٍ حقيقيّ. والفرق مهمّ: عطلٌ
  // عابر كان يُعيد null فيُطرد المدير من /manage إلى لوحة العضو بلا كلمة،
  // كأنّه ليس مديرًا.
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`getStaffProfile: ${JSON.stringify(error)}`);
  const me = data as Profile | null;
  if (!me || (me.role !== "admin" && me.role !== "supervisor")) return null;
  return me;
}

/** الملف الشخصي للمستخدم إن كان مديرًا، وإلا null. إجراءات المرحلة ٥ للمدير وحده. */
export async function getAdminProfile(): Promise<Profile | null> {
  const me = await getStaffProfile();
  return me && me.role === "admin" ? me : null;
}

/** كل الأعضاء الظاهرين للمستخدم (RLS: المدير الكل، المشرف طلبته). */
export async function getMembers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("status", { ascending: true })
    .order("full_name", { ascending: true });
  if (error) throw new Error(`getMembers: ${JSON.stringify(error)}`);
  return (data ?? []) as Profile[];
}

export async function getActiveCycle(): Promise<ProgramCycle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_cycles")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getActiveCycle: ${JSON.stringify(error)}`);
  return (data ?? null) as ProgramCycle | null;
}

export async function getHalaqat(): Promise<Halaqa[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("halaqat")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getHalaqat: ${JSON.stringify(error)}`);
  return (data ?? []) as Halaqa[];
}

/** الانتساب النشط فقط — عضو واحد لا يكون في حلقتين في آنٍ واحد. */
export async function getEnrollments(): Promise<Enrollment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("enrollments").select("*").eq("active", true);
  if (error) throw new Error(`getEnrollments: ${JSON.stringify(error)}`);
  return (data ?? []) as Enrollment[];
}

/** كل حصص الدورة الحالية — تملأ جدول التتبع (RLS يقصر المشرف على طلبته). */
export async function getCycleSessions(cycleId: string): Promise<WeeklySession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_sessions")
    .select("*")
    .eq("cycle_id", cycleId);
  if (error) throw new Error(`getCycleSessions: ${JSON.stringify(error)}`);
  return (data ?? []) as WeeklySession[];
}

/** تقدّم الحفظ لكل عضو ظاهر (RLS يقصر المشرف على طلبته). */
export async function getProgress(): Promise<HifzProgress[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("hifz_progress").select("*");
  if (error) throw new Error(`getProgress: ${JSON.stringify(error)}`);
  return (data ?? []) as HifzProgress[];
}
