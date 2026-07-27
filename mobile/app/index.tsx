// بوّابة التوجيه. لا واجهة لها — تقرّر فقط أين يذهب العضو.
//
// نفس بوّابة `web/app/dashboard/layout.tsx`: من ليس "active" لا يدخل
// اللوحة. القاعدة نفسها مطبَّقة في RLS أيضًا، فهذه الشاشة راحةٌ للعضو لا
// حماية — الحماية في القاعدة.
import { Redirect } from "expo-router";

import { useSession } from "../lib/session";
import Loading from "../components/Loading";

export default function Index() {
  const { session, profile, loading } = useSession();

  if (loading) return <Loading />;
  if (!session) return <Redirect href="/login" />;
  // الملف لم يصل بعد رغم وجود جلسة (شبكة بطيئة) — ننتظر بدل أن نطرده.
  if (!profile) return <Loading />;
  if (profile.status !== "active") return <Redirect href="/login" />;

  return <Redirect href="/(tabs)" />;
}
