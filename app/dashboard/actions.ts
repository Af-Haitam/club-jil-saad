"use server";

// إجراءات العضو نفسه — لا إدارة هنا.
import { createClient } from "@/lib/supabase/server";
import { strings } from "@/lib/strings";

/**
 * تسجيل إجابة على سؤال.
 *
 * لا تحقّق هنا من فتح السؤال ولا من انقضاء وقته ولا من صواب الاختيار:
 * كلّ ذلك في `submit_answer()` داخل القاعدة، وهي الجهة الوحيدة التي تعرف
 * الجواب الصحيح أصلًا. وتكرار الحكم هنا يعني حكمين قد يختلفان يومًا.
 */
export type AnswerResult = {
  ok: boolean;
  error?: string;
  is_correct?: boolean;
  points?: number;
  correct_ids?: string[];
  explanation?: string | null;
};

export async function answerQuestion(
  questionId: string,
  optionIds: string[],
): Promise<AnswerResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_answer", {
    p_question: questionId,
    p_options: optionIds,
  });

  if (error) return { ok: false, error: strings.dashboard.quizFailed };

  // **لا `revalidatePath` هنا عمدًا.** الصفحة لا تعرض إلّا ما لم يُجب عنه،
  // فالتجديد الآن يُبخّر البطاقة في اللحظة نفسها ولا يرى أحدٌ صوابه. تعود
  // النتيجة إلى المتصفّح ليعرضها خمس ثوانٍ، ثمّ يطلب هو التجديد.
  const r = (data ?? {}) as {
    is_correct?: boolean;
    points?: number;
    correct_ids?: string[];
    explanation?: string | null;
  };
  return {
    ok: true,
    is_correct: r.is_correct,
    points: r.points,
    correct_ids: r.correct_ids ?? [],
    explanation: r.explanation ?? null,
  };
}
