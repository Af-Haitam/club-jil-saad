// عميل Supabase للتطبيق.
//
// **لا مفتاح خدمة هنا إطلاقًا.** التطبيق يحمل مفتاح anon وحده، وما يحمي
// بيانات الأعضاء هو RLS في القاعدة لا التطبيق — وهي مضبوطة ومختبَرة منذ
// المرحلة الثانية. أيّ استعلامٍ هنا يرى ما يراه العضو نفسه فقط.
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // يفشل عند الإقلاع لا عند أوّل استعلام: بناءٌ بلا مفاتيح يجب أن يُكتشف
  // في CI، لا على هاتف عضوٍ يرى شاشةً فارغة.
  throw new Error("EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_ANON_KEY مطلوبان");
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // لا عناوين URL في تطبيقٍ أصيل — هذا الخيار للمتصفّح وحده، وتركه
    // مفعَّلًا يجعل العميل يفتّش عن رمزٍ في عنوانٍ غير موجود.
    detectSessionInUrl: false,
  },
});
