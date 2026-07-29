// الأسئلة والنقاط — الجانب القارئ.
//
// كلّ ما هنا يمرّ عبر دوالٍّ مُعرِّفة في القاعدة، لا عبر الجداول مباشرةً.
// وهذا ليس تفضيلًا في الأسلوب: `question_options` لا تملك سياسة قراءةٍ
// للأعضاء أصلًا، فلو حاول هذا الملفّ أن يستعلم عنها لعاد بصفرِ صفوف.
// الصواب لا يصل إلى الجهاز إلّا بعد أن تُسجَّل الإجابة.
import { supabase } from "./supabase";

export type Option = {
  id: string;
  body: string;
  /** ‏`null` ما دام السؤال مفتوحًا ولم يُجب عنه — والحجب في القاعدة لا هنا. */
  is_correct: boolean | null;
};

export type Question = {
  id: string;
  title: string;
  body: string | null;
  points: number;
  status: "open" | "closed";
  /** أكثر من جوابٍ صحيح. عَلَمٌ صريح — لو استُنتج من عدد الصواب لأفشاه. */
  multi_select: boolean;
  published_at: string | null;
  closes_at: string | null;
  expired: boolean;
  explanation: string | null;
  answer: { option_ids: string[]; is_correct: boolean; points: number } | null;
  options: Option[];
};

export type Score = {
  points: number;
  answered: number;
  correct: number;
  position: number | null;
};

export type BoardRow = {
  position: number;
  member_id: string;
  full_name: string;
  points: number;
  is_me: boolean;
};

export async function getQuestions(): Promise<Question[]> {
  const { data, error } = await supabase.rpc("get_questions");
  if (error) throw new Error(error.message);
  return (data ?? []) as Question[];
}

export async function getScore(): Promise<Score> {
  const { data, error } = await supabase.rpc("my_score");
  if (error) throw new Error(error.message);
  return data as Score;
}

export async function getBoard(): Promise<BoardRow[]> {
  const { data, error } = await supabase.rpc("get_leaderboard");
  if (error) throw new Error(error.message);
  return (data ?? []) as BoardRow[];
}

export type SubmitResult = {
  is_correct: boolean;
  points: number;
  correct_ids: string[];
  explanation: string | null;
};

export async function submitAnswer(
  questionId: string,
  optionIds: string[],
): Promise<SubmitResult> {
  const { data, error } = await supabase.rpc("submit_answer", {
    p_question: questionId,
    p_options: optionIds,
  });
  if (error) throw new Error(error.message);
  return data as SubmitResult;
}
