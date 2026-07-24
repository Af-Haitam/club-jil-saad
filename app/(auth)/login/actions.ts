"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, mapAuthError, zodFieldErrors, type ActionState } from "@/lib/validation/auth";
import { strings } from "@/lib/strings";

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  let result: ActionState = {};
  let destination: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      result = { ok: false, error: mapAuthError(error) };
    } else {
      // العميل نفسه يحمل الجلسة الآن — أضمن من عميل جديد يعتمد على انتشار
      // الكوكيز داخل الإجراء ذاته.
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", data.user.id)
        .single();
      destination = profile?.status === "active" ? "/dashboard" : "/pending";
    }
  } catch {
    result = { ok: false, error: strings.auth.errGeneric };
  }

  // redirect() يُستدعى خارج try/catch عمدًا — يرمي NEXT_REDIRECT وهذا متوقّع.
  if (destination) redirect(destination);
  return result;
}
