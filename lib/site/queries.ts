// مصدر محتوى الصفحة الرئيسية — قاعدة البيانات أولًا، والملف المكتوب احتياطًا.
//
// لماذا الاحتياط ضروري: مشروع Supabase المجاني يُوقَف بعد ٧ أيام خمول، والصفحة
// الرئيسية هي وجه النادي العلني. بلا هذا السقوط الآمن قد يستقبل الزائر صفحة
// فارغة في أسبوع هادئ. لذلك لا يُحذف lib/site-content.ts أبدًا.
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { allSections } from "@/lib/site-content";
import type { SectionType } from "@/lib/site-content";

export type SiteSectionRow = {
  id: string | null;
  type: SectionType;
  order_index: number;
  is_visible: boolean;
  content: Record<string, unknown>;
};

/** النسخة الاحتياطية: نفس الأقسام التسعة بشكل صفوف القاعدة. */
export const fallbackSections: SiteSectionRow[] = allSections.map((s) => ({
  id: null,
  type: s.type,
  order_index: s.order,
  is_visible: s.visible,
  content: s.content as Record<string, unknown>,
}));

/**
 * أقسام الصفحة الرئيسية العامة — بعميل بلا كوكيز حتى تبقى `/` ثابتة.
 * RLS يعيد المرئي فقط لأنّ الطلب بلا JWT.
 *
 * صفر صفوف تعني إمّا أنّ الجدول لم يُبذَر بعد، وإمّا أنّ المدير أخفى الأقسام
 * كلها. الحالتان تُعرضان بالنسخة الاحتياطية: صفحةٌ صحيحة خيرٌ من صفحة بيضاء.
 */
export async function getSections(): Promise<SiteSectionRow[]> {
  try {
    const { data, error } = await createPublicClient()
      .from("site_sections")
      .select("id, type, order_index, is_visible, content")
      .order("order_index", { ascending: true });

    if (error || !data || data.length === 0) return fallbackSections;
    return data as SiteSectionRow[];
  } catch {
    return fallbackSections;
  }
}

/** كل الأقسام بما فيها المخفيّة — للمحرّر. يحتاج جلسة المدير (RLS). */
export async function getAllSections(): Promise<SiteSectionRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_sections")
      .select("id, type, order_index, is_visible, content")
      .order("order_index", { ascending: true });

    if (error || !data || data.length === 0) return fallbackSections;
    return data as SiteSectionRow[];
  } catch {
    return fallbackSections;
  }
}

/** هل المحتوى مقروء من القاعدة فعلًا؟ يخبر المحرّر أنّ البذر لم يتم بعد. */
export async function sectionsAreSeeded(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase.from("site_sections").select("id", { count: "exact", head: true });
    return !error && (count ?? 0) > 0;
  } catch {
    return false;
  }
}
