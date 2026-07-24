"use server";

// تسجيل الخروج — إجراء خادم (Server Action) مشترك تستدعيه أي واجهة.
// Sign-out server action, shared by any UI that needs a sign-out button.

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
