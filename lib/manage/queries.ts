// طبقة قراءة منطقة الإدارة — للمدير/المشرف. RLS يقصر المشرف على طلبته.
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProgramCycle, Halaqa } from "@/lib/types/database";

/** الملف الشخصي للمستخدم إن كان مديرًا أو مشرفًا، وإلا null (لبوّابة /manage). */
export async function getStaffProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const me = data as Profile | null;
  if (!me || (me.role !== "admin" && me.role !== "supervisor")) return null;
  return me;
}

/** كل الأعضاء الظاهرين للمستخدم (RLS: المدير الكل، المشرف طلبته). */
export async function getMembers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("status", { ascending: true })
    .order("full_name", { ascending: true });
  return (data ?? []) as Profile[];
}

export async function getActiveCycle(): Promise<ProgramCycle | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("program_cycles")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data ?? null) as ProgramCycle | null;
}

export async function getHalaqat(): Promise<Halaqa[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("halaqat").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Halaqa[];
}
