// عميل قراءة عامّ بلا كوكيز.
//
// عميل الخادم في server.ts يقرأ الكوكيز، وقراءة الكوكيز تُجبر Next على تصيير
// الصفحة عند كل طلب. الصفحة الرئيسية لا تحتاج جلسة المستخدم أصلًا، فلو استعملت
// ذاك العميل لتحوّلت من صفحة ثابتة إلى صفحة ديناميكية — وهذا ثمن باهظ لواجهة
// النادي العلنية على استضافة مجانية وقاعدةٍ تنام بعد أسبوع خمول.
//
// بلا JWT يعامل RLS الطلب كـ anon، فلا تُقرأ إلّا الأقسام المرئية — وهو تحديدًا
// ما تريده الصفحة العامة.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
