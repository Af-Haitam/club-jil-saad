"use server";

import { createClient } from "@/lib/supabase/server";
import { resetSchema, mapAuthError, zodFieldErrors, type ActionState } from "@/lib/validation/auth";
import { strings } from "@/lib/strings";

export async function resetAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  } catch {
    return { ok: false, error: strings.auth.errGeneric };
  }

  // لا redirect هنا — النجاح يُعرض في نفس الصفحة (resetDone + رابط الدخول).
  return { ok: true };
}
