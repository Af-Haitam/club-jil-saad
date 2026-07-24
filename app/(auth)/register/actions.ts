"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  registerSchema,
  mapAuthError,
  zodFieldErrors,
  type ActionState,
} from "@/lib/validation/auth";
import { strings } from "@/lib/strings";
import type { SignupMetadata } from "@/lib/types/database";

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
    path: formData.get("path"),
    session_day: formData.get("session_day"),
    weekly_amount: formData.get("weekly_amount"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { full_name, phone, email, password, path, session_day, weekly_amount } =
    parsed.data;

  // ملاحظة: role/status ليست هنا أبدًا — يفرضها المُشغّل handle_new_user() في القاعدة.
  const metadata: SignupMetadata = {
    full_name,
    phone,
    in_club: path === "club",
    session_day,
    weekly_amount,
  };

  let result: ActionState = {};
  let success = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      result = { ok: false, error: mapAuthError(error) };
    } else if (!data.session) {
      // تأكيد البريد مُفعّل في Supabase: أُنشئ الحساب بلا جلسة — لا نوجّهه إلى
      // ‏/pending المحمي، بل نطلب تأكيد البريد ثم الدخول (تدهور لطيف).
      result = { ok: true, notice: strings.auth.checkEmail };
    } else {
      success = true;
    }
  } catch {
    result = { ok: false, error: strings.auth.errGeneric };
  }

  // redirect() يرمي استثناءً خاصًا بالتحكم في التدفّق — يجب استدعاؤه خارج try/catch
  // (توثيق Next.js: "redirect should be called outside the try block").
  if (success) redirect("/pending");
  return result;
}
