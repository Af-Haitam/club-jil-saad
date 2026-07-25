"use server";

// كل إجراءات منطقة الإدارة في مكان واحد — تُستورد من الصفحة الواحدة ومن نماذجها.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminProfile, getStaffProfile } from "@/lib/manage/queries";
import { pushRoster } from "@/lib/manage/google-sheet";
import { allSections } from "@/lib/site-content";
import type { SessionStatus } from "@/lib/types/database";
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

// ═══════════ المرحلة ٦: محرّر الصفحة الرئيسية ═══════════
// كل تعديل يستدعي revalidatePath("/") — الصفحة ثابتة، فالتجديد عند الطلب هو
// ما يجعل التغيير يظهر فورًا بدل انتظار ساعة التجديد الدورية.

/** بذر الأقسام التسعة من الشيفرة إلى القاعدة — مرّة واحدة، وآمن التكرار. */
export async function seedSections(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const me = await getAdminProfile();
  if (!me) return { ok: false, error: strings.manage.errAdminOnly };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("site_sections").select("type");
  const have = new Set((existing ?? []).map((r) => (r as { type: string }).type));

  const missing = allSections
    .filter((s) => !have.has(s.type))
    .map((s) => ({
      type: s.type,
      order_index: s.order,
      is_visible: s.visible,
      content: s.content as Record<string, unknown>,
    }));

  if (missing.length > 0) {
    const { error } = await supabase.from("site_sections").insert(missing);
    if (error) return { ok: false, error: strings.auth.errGeneric };
  }

  revalidatePath("/");
  revalidatePath("/manage");
  return { ok: true, notice: strings.manage.siteSeeded };
}

/** حفظ محتوى قسم. المحتوى يصل كـ JSON كامل، فالحقول التي لم يعرضها النموذج تبقى. */
export async function saveSection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("content") ?? "");
  if (!id || !raw) return { ok: false, error: strings.auth.errGeneric };
  if (raw.length > 200_000) return { ok: false, error: strings.auth.errGeneric };

  const me = await getAdminProfile();
  if (!me) return { ok: false, error: strings.manage.errAdminOnly };

  let content: unknown;
  try {
    content = JSON.parse(raw);
  } catch {
    return { ok: false, error: strings.auth.errGeneric };
  }
  if (typeof content !== "object" || content === null || Array.isArray(content)) {
    return { ok: false, error: strings.auth.errGeneric };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_sections")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: strings.auth.errGeneric };

  revalidatePath("/");
  revalidatePath("/manage");
  return { ok: true, notice: strings.manage.siteSaved };
}

/** إظهار/إخفاء قسم. */
export async function toggleSection(id: string, visible: boolean): Promise<{ ok: boolean }> {
  if (typeof id !== "string" || !id || typeof visible !== "boolean") return { ok: false };
  const me = await getAdminProfile();
  if (!me) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("site_sections").update({ is_visible: visible }).eq("id", id);
  if (error) return { ok: false };

  revalidatePath("/");
  revalidatePath("/manage");
  return { ok: true };
}

/**
 * تحريك قسم خطوة. نبادل order_index مع جاره في الاتجاه المطلوب.
 * القراءة قبل الكتابة تمنع الاعتماد على ترتيبٍ أرسله المتصفّح وقد يكون قديمًا.
 */
export async function moveSection(id: string, direction: "up" | "down"): Promise<{ ok: boolean }> {
  if (typeof id !== "string" || !id || (direction !== "up" && direction !== "down")) return { ok: false };
  const me = await getAdminProfile();
  if (!me) return { ok: false };

  const supabase = await createClient();
  const { data } = await supabase.from("site_sections").select("id, order_index").order("order_index");
  const list = (data ?? []) as { id: string; order_index: number }[];

  const i = list.findIndex((s) => s.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return { ok: false }; // عند الطرف: لا شيء

  const a = list[i];
  const b = list[j];
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("site_sections").update({ order_index: b.order_index }).eq("id", a.id),
    supabase.from("site_sections").update({ order_index: a.order_index }).eq("id", b.id),
  ]);
  if (e1 || e2) return { ok: false };

  revalidatePath("/");
  revalidatePath("/manage");
  return { ok: true };
}

// ── دفع قائمة الأعضاء إلى جدول Google (بطلب صريح، لا مع كل حفظة) ──
export async function syncSheet(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const me = await getAdminProfile();
  if (!me) return { ok: false, error: strings.manage.errAdminOnly };

  const result = await pushRoster();
  if (!result.ok) {
    return {
      ok: false,
      error: result.reason === "unconfigured" ? strings.manage.sheetUnconfigured : strings.manage.errSheet,
    };
  }
  return { ok: true, notice: `${strings.manage.sheetSynced} — ${result.count} ${strings.manage.statMembers}` };
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

// ── تغيير عدد أسابيع الدورة النشطة ──
// يحتاج سياسة cycles_write من 0004_cycles_write.sql؛ بدونها يرفض RLS التحديث
// بلا خطأ (صفر صفوف متأثّرة)، لذلك نطلب select ونتحقق من العدد بأنفسنا.
export async function setCycleWeeks(weeks: number): Promise<{ ok: boolean; error?: string }> {
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 53) {
    return { ok: false, error: strings.manage.errWeekRange };
  }

  const me = await getAdminProfile();
  if (!me) return { ok: false, error: strings.manage.errAdminOnly };

  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("program_cycles")
    .select("id, week_count")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!cycle) return { ok: false, error: strings.manage.noCycle };

  const current = cycle as { id: string; week_count: number };

  // التقليص يخفي بيانات مسجّلة بدل أن يحذفها — وهو أسوأ من الحذف لأنّه صامت.
  if (weeks < current.week_count) {
    const { count } = await supabase
      .from("weekly_sessions")
      .select("id", { count: "exact", head: true })
      .eq("cycle_id", current.id)
      .gt("week_number", weeks)
      .neq("status", "pending");
    if ((count ?? 0) > 0) return { ok: false, error: strings.manage.errWeekHasData };
  }

  const { data: updated, error } = await supabase
    .from("program_cycles")
    .update({ week_count: weeks })
    .eq("id", current.id)
    .select("id");
  if (error) return { ok: false, error: strings.auth.errGeneric };
  if (!updated || updated.length === 0) return { ok: false, error: strings.manage.errWeekBlocked };

  revalidatePath("/manage");
  revalidatePath("/dashboard");
  return { ok: true };
}

// ── تلوين خانة في جدول التتبع: الحالة وحدها، بأقل قدر ممكن من العمل ──
// upsert يحدّث الأعمدة المُرسَلة فقط، فالسورة والآية والملاحظة المسجّلة سابقًا تبقى.
const CELL_STATUSES: SessionStatus[] = ["green", "red", "absent", "excused", "pending"];

export async function setCellStatus(
  memberId: string,
  weekNumber: number,
  status: SessionStatus
): Promise<{ ok: boolean }> {
  // لا نثق بالعميل: هذه وسائط مُسلسلة، وأي متصفّح يستطيع اختلاقها.
  if (typeof memberId !== "string" || memberId.length === 0) return { ok: false };
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 53) return { ok: false };
  if (!CELL_STATUSES.includes(status)) return { ok: false };

  const me = await getStaffProfile();
  if (!me) return { ok: false };

  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("program_cycles")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!cycle) return { ok: false };

  // RLS: is_admin() OR supervises(member_id) — المشرف لا يلوّن خانة غير طلبته.
  const { error } = await supabase.from("weekly_sessions").upsert(
    {
      member_id: memberId,
      cycle_id: cycle.id,
      week_number: weekNumber,
      status,
      evaluated_by: me.id,
      evaluated_at: new Date().toISOString(),
    },
    { onConflict: "member_id,cycle_id,week_number" }
  );
  if (error) return { ok: false };

  revalidatePath("/manage");
  revalidatePath("/dashboard");
  return { ok: true };
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
