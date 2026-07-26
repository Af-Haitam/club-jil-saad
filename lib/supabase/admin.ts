// عميل بمفتاح الخدمة — يتجاوز RLS تمامًا. للخادم وحده، بلا استثناء.
//
// لماذا يلزم أصلًا؟ سياسة push_tokens هي «اشتراكاتك أنت فقط»، وهذا صحيح:
// لا يحقّ لعضو قراءة أجهزة غيره. لكنّ مُرسِل التنبيه يحتاج بالضبط ذلك —
// أن يقرأ اشتراكات الآخرين ليدفع إليها. والمهمّة اليومية تعمل بلا جلسة
// مستخدم أصلًا، فلا auth.uid() لها تستند إليه.
//
// القاعدة الصارمة: لا يُستورد هذا الملف من أيّ ملف فيه "use client"،
// ولا من تطبيق Expo. الحارس أدناه يجعل الخطأ صاخبًا لا صامتًا.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() في المتصفح — مفتاح الخدمة لا يغادر الخادم");
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY غير مضبوط");

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
