"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, zodFieldErrors, type ActionState } from "@/lib/validation/auth";
import { strings } from "@/lib/strings";

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    session_day: formData.get("session_day"),
    weekly_amount: formData.get("weekly_amount"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { full_name, phone, session_day, weekly_amount } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: strings.auth.errGeneric };

  // role/status/membership لا تُلمس هنا — والمُشغّل يجمّدها أصلًا لغير المدير.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      phone: phone ? phone : null,
      session_day,
      weekly_amount,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: strings.auth.errGeneric };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { ok: true, notice: strings.dashboard.profileSaved };
}
