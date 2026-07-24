"use server";

import { createClient } from "@/lib/supabase/server";
import { forgotSchema, zodFieldErrors, type ActionState } from "@/lib/validation/auth";

export async function forgotAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
    });
  } catch {
    // يُبتلع عمدًا — لا نكشف أبدًا ما إذا كان البريد مسجّلًا أو ما إذا نجح
    // الإرسال فعليًا؛ الواجهة تعرض نفس الرسالة دائمًا (forgotSent).
  }

  return { ok: true };
}
