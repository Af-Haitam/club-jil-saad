// الأسئلة والنقاط على الويب.
//
// نفس دوالّ التطبيق حرفًا — وهذا مقصود: أعضاء آيفون لا تطبيق لهم، فلو كانت
// المسابقة في التطبيق وحده لخرجوا منها كلّهم. المنطق كلّه في القاعدة،
// فالواجهتان تسألان السؤال نفسه ولا تكرّران حكمًا.
import { createClient } from "@/lib/supabase/server";

export type QuizOption = {
  id: string;
  body: string;
  /** ‏`null` ما دام مفتوحًا ولم يُجب عنه — القاعدة هي التي تحجب. */
  is_correct: boolean | null;
};

export type QuizQuestion = {
  id: string;
  title: string;
  body: string | null;
  points: number;
  status: string;
  /** أكثر من جوابٍ صحيح — عَلَمٌ صريح في القاعدة لا استنتاجٌ من العدد. */
  multi_select: boolean;
  published_at: string | null;
  closes_at: string | null;
  expired: boolean;
  explanation: string | null;
  answer: { option_ids: string[]; is_correct: boolean; points: number } | null;
  options: QuizOption[];
};

export type QuizScore = {
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

export type QuizData = {
  open: QuizQuestion | null;
  score: QuizScore;
  board: BoardRow[];
};

/**
 * كل ما تحتاجه بطاقة المسابقة، أو null.
 *
 * وnull هنا حالةٌ عاديّة لا عطل: ما دامت هجرة 0008 غير مطبَّقة فالدوالّ
 * غير موجودة، ويجب أن تختفي البطاقة وحدها دون أن تُسقط بقيّة اللوحة.
 */
export async function getQuiz(): Promise<QuizData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [qRes, sRes, bRes] = await Promise.all([
    supabase.rpc("get_questions"),
    supabase.rpc("my_score"),
    supabase.rpc("get_leaderboard"),
  ]);

  if (qRes.error || sRes.error || bRes.error) return null;

  const questions = (qRes.data ?? []) as QuizQuestion[];
  return {
    open: questions.find((q) => !q.expired) ?? null,
    score: sRes.data as QuizScore,
    board: (bRes.data ?? []) as BoardRow[],
  };
}
