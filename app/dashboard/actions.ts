"use server";

// إجراءات العضو نفسه — لا إدارة هنا.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { strings } from "@/lib/strings";

/**
 * تسجيل إجابة على سؤال.
 *
 * لا تحقّق هنا من فتح السؤال ولا من انقضاء وقته ولا من صواب الاختيار:
 * كلّ ذلك في `submit_answer()` داخل القاعدة، وهي الجهة الوحيدة التي تعرف
 * الجواب الصحيح أصلًا. وتكرار الحكم هنا يعني حكمين قد يختلفان يومًا.
 */
export async function answerQuestion(
  questionId: string,
  optionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_answer", {
    p_question: questionId,
    p_option: optionId,
  });

  if (error) return { ok: false, error: strings.dashboard.quizFailed };

  revalidatePath("/dashboard");
  return { ok: true };
}
