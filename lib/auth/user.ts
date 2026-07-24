// مساعدات المستخدم/الملف الشخصي — للاستخدام في مكوّنات الخادم فقط.
// User/profile helpers — server-only. Never import from a "use client" file.

import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

/** The current auth user, or null if signed out. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/** The caller's own `profiles` row, or null if signed out (or the row is missing). */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}
