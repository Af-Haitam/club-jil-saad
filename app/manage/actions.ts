"use server";

// كل إجراءات منطقة الإدارة في مكان واحد — تُستورد من الصفحة الواحدة ومن نماذجها.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminProfile } from "@/lib/manage/queries";
import {
  recordSchema,
  halaqaSchema,
  halaqaEditSchema,
  examSchema,
  contentSchema,
  memberSchema,
} from "@/lib/validation/manage";
import { zodFieldErrors, type ActionState } from "@/lib/validation/auth";
import { strings } from "@/lib/strings";

// ── قبول عضو: pending → active. RLS+المُشغّل يسمحان للمدير فقط بتغيير الحالة. ──
export async function approveMember(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ status: "active" }).eq("id", id);
  revalidatePath("/manage");
}

// ── رفض طلب انضمام: pending → suspended (قابل للعكس، ولا يفقد أي بيانات) ──
export async function rejectMember(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const me = await getAdminProfile();
  if (!id || !me || id === me.id) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ status: "suspended" }).eq("id", id);
  revalidatePath("/manage");
}

// ── تعديل عضو: الدور والحالة والعضوية والحلقة والتقدم في حفظة واحدة ──
export async function updateMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  const v = parsed.data;

  // الأدوار والحالات للمدير وحده — لا نثق بما أرسله المتصفّح، نقرأ الدور من القاعدة.
  const me = await getAdminProfile();
  if (!me) return { ok: false, error: strings.manage.errAdminOnly };

  // حارس ١: لا تغيّر دورك أو حالتك بنفسك — أسهل طريق لقفل نفسك خارج الإدارة.
  if (v.id === me.id && (v.role !== me.role || v.status !== me.status)) {
    return { ok: false, error: strings.manage.errSelfRole };
  }

  const supabase = await createClient();

  // حارس ٢: لا يبقى النادي بلا مدير واحد على الأقل.
  if (v.role !== "admin") {
    const { data: target } = await supabase.from("profiles").select("role").eq("id", v.id).single();
    if (target?.role === "admin") {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) return { ok: false, error: strings.manage.errLastAdmin };
    }
  }

  // RLS: profiles_update = is_admin() · والمُشغّل protect_profile_columns يفكّ
  // تجميد role/status/in_club/in_hifz للمدير وحده.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role: v.role,
      status: v.status,
      in_hifz: v.in_hifz,
      in_club: v.in_club,
      session_day: v.session_day,
      session_time: v.session_time,
      weekly_amount: v.weekly_amount,
    })
    .eq("id", v.id);
  if (profileError) return { ok: false, error: strings.auth.errGeneric };

  // الحلقة: عضو في حلقة واحدة فقط — عطّل القديم ثم فعّل المختار.
  // القيد unique(member_id, halaqa_id) يجعل العودة لحلقة سابقة تحديثًا لا صفًّا جديدًا.
  const { error: offError } = await supabase
    .from("enrollments")
    .update({ active: false })
    .eq("member_id", v.id)
    .eq("active", true);
  if (offError) return { ok: false, error: strings.auth.errGeneric };

  if (v.halaqa_id) {
    const { error: onError } = await supabase
      .from("enrollments")
      .upsert({ member_id: v.id, halaqa_id: v.halaqa_id, active: true }, { onConflict: "member_id,halaqa_id" });
    if (onError) return { ok: false, error: strings.auth.errGeneric };
  }

  // التقدم: صف واحد لكل عضو (unique member_id) — يُنشأ عند أول حفظ.
  const { error: progressError } = await supabase.from("hifz_progress").upsert(
    {
      member_id: v.id,
      current_surah: v.current_surah,
      current_ayah: v.current_ayah,
      memorized_pages: v.memorized_pages,
      memorized_juz: v.memorized_juz,
      last_updated_by: me.id,
    },
    { onConflict: "member_id" }
  );
  if (progressError) return { ok: false, error: strings.auth.errGeneric };

  revalidatePath("/manage");
  revalidatePath("/dashboard");
  return { ok: true, notice: strings.manage.memberSaved };
}

// ── تعديل حلقة قائمة ──
export async function updateHalaqa(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = halaqaEditSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  const v = parsed.data;

  const me = await getAdminProfile();
  if (!me) return { ok: false, error: strings.manage.errAdminOnly };

  const supabase = await createClient();
  const { error } = await supabase
    .from("halaqat")
    .update({
      name: v.name,
      supervisor_id: v.supervisor_id,
      schedule_note: v.schedule_note,
      capacity: v.capacity,
    })
    .eq("id", v.id);
  if (error) return { ok: false, error: strings.auth.errGeneric };

  revalidatePath("/manage");
  return { ok: true, notice: strings.manage.halaqaSaved };
}

// ── تسجيل حصّة الاستظهار الأسبوعية ──
export async function recordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = recordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  const v = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: strings.auth.errGeneric };

  const { data: cycle } = await supabase
    .from("program_cycles")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!cycle) return { ok: false, error: strings.manage.noCycle };

  // RLS: is_admin() OR supervises(member_id) — القاعدة تمنع تسجيل مشرف لغير طلبته.
  const { error } = await supabase.from("weekly_sessions").upsert(
    {
      member_id: v.member_id,
      cycle_id: cycle.id,
      week_number: v.week_number,
      status: v.status,
      from_surah: v.from_surah,
      from_ayah: v.from_ayah,
      to_surah: v.to_surah,
      to_ayah: v.to_ayah,
      hizb_number: v.hizb_number,
      mistakes_count: v.mistakes_count,
      notes: v.notes,
      evaluated_by: user.id,
      evaluated_at: new Date().toISOString(),
    },
    { onConflict: "member_id,cycle_id,week_number" }
  );
  if (error) return { ok: false, error: strings.auth.errGeneric };

  revalidatePath("/dashboard");
  revalidatePath("/manage");
  return { ok: true, notice: strings.manage.recordSaved };
}

// ── إنشاء حلقة ──
export async function createHalaqa(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = halaqaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  const v = parsed.data;

  const supabase = await createClient();
  // RLS: halaqat_write = is_admin()
  const { error } = await supabase.from("halaqat").insert({
    name: v.name,
    supervisor_id: v.supervisor_id,
    schedule_note: v.schedule_note,
    capacity: v.capacity,
  });
  if (error) return { ok: false, error: strings.auth.errGeneric };

  revalidatePath("/manage");
  return { ok: true, notice: strings.manage.halaqaCreated };
}

// ── إنشاء اختبار (نطاق: الجميع/حلقة/عضو) ──
export async function createExam(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = examSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  const v = parsed.data;

  if (v.scope === "member" && !v.member_id) return { ok: false, error: strings.auth.errGeneric };
  if (v.scope === "halaqa" && !v.halaqa_id) return { ok: false, error: strings.auth.errGeneric };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: strings.auth.errGeneric };

  // RLS: exams_write = is_admin() OR is_supervisor()
  const { error } = await supabase.from("exams").insert({
    scope: v.scope,
    member_id: v.scope === "member" ? v.member_id : null,
    halaqa_id: v.scope === "halaqa" ? v.halaqa_id : null,
    title: v.title,
    exam_date: v.exam_date,
    exam_time: v.exam_time,
    location: v.location,
    from_surah: v.from_surah,
    from_ayah: v.from_ayah,
    to_surah: v.to_surah,
    to_ayah: v.to_ayah,
    status: "upcoming",
    created_by: user.id,
  });
  if (error) return { ok: false, error: strings.auth.errGeneric };

  revalidatePath("/dashboard");
  revalidatePath("/manage");
  return { ok: true, notice: strings.manage.examCreated };
}

// ── نشر محتوى: إعلان (announcements) أو تذكير (reminders) ──
export async function publishContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const kind = String(formData.get("kind") ?? "ad"); // "ad" | "reminder"
  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  const v = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: strings.auth.errGeneric };

  // RLS: is_admin() OR is_supervisor()
  const table = kind === "reminder" ? "reminders" : "announcements";
  const { error } = await supabase.from(table).insert({
    title: v.title,
    body: v.body,
    image_url: v.image_url,
    audience_type: v.audience_type,
    author_id: user.id,
    published_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: strings.auth.errGeneric };

  revalidatePath("/dashboard");
  revalidatePath("/manage");
  return {
    ok: true,
    notice: kind === "reminder" ? strings.manage.reminderPublished : strings.manage.adPublished,
  };
}
