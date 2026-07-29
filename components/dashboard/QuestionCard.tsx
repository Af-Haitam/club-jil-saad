"use client";

// سؤال النادي على الويب — توأم بطاقة التطبيق.
//
// خطوتان لا واحدة: الضغطة الأولى تُعلّم، والثانية تُرسل. الإجابة لا رجعة
// فيها، ولمسةٌ خاطئة تحرق المحاولة الوحيدة.
import { useState, useTransition } from "react";
import { answerQuestion } from "@/app/dashboard/actions";
import type { QuizQuestion } from "@/lib/dashboard/quiz";
import { strings } from "@/lib/strings";

/** أبجد هوّز — كما في الكتب العربية، وكما يراها العضو في التطبيق. */
const ABJAD = ["أ", "ب", "ج", "د", "هـ", "و"];

const d = strings.dashboard;

export default function QuestionCard({ question }: { question: QuizQuestion }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const answered = question.answer !== null;
  const locked = answered || question.expired;
  const correctId = question.options.find((o) => o.is_correct)?.id ?? null;
  const myId = question.answer?.option_id ?? null;
  const won = question.answer?.is_correct ?? false;

  function send() {
    if (!picked) return;
    setFailed(false);
    startTransition(async () => {
      const res = await answerQuestion(question.id, picked);
      if (!res.ok) setFailed(true);
    });
  }

  return (
    <section className="rounded-xl border border-gold/30 bg-ink-soft/50 p-6">
      <h2 className="font-display text-sm tracking-wide text-gold">{d.quizTitle}</h2>

      <p className="mt-3 font-display text-lg leading-9 text-parchment">{question.title}</p>
      {question.body && (
        <p className="mt-2 text-sm leading-7 text-parchment/65">{question.body}</p>
      )}

      <ul className="mt-5 flex flex-col gap-2.5">
        {question.options.map((o, i) => {
          const isMine = myId === o.id;
          const isRight = correctId === o.id;
          const isPicked = picked === o.id && !locked;

          // بعد الإجابة: الصواب أخضر دائمًا وخطؤك أحمر — وإن أصبتَ فهما واحد
          let tone = "border-ink-line";
          if (locked && isRight) tone = "border-tick-green bg-tick-green/12";
          else if (locked && isMine) tone = "border-tick-red bg-tick-red/12";
          else if (isPicked) tone = "border-gold bg-gold/10";

          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={locked || pending}
                onClick={() => setPicked(o.id)}
                aria-pressed={isPicked || isMine}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-start transition-colors ${tone} ${
                  locked ? "cursor-default" : "hover:border-gold/60"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                    isPicked ? "border-gold bg-gold text-ink" : "border-gold/40 text-gold-light"
                  }`}
                >
                  {ABJAD[i] ?? i + 1}
                </span>
                <span className="flex-1 text-sm leading-7 text-parchment">{o.body}</span>
                {locked && isRight && <span className="text-tick-green">✓</span>}
                {locked && isMine && !isRight && <span className="text-tick-red">✕</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {!locked && (
        <>
          <p className="mt-4 text-center text-xs text-parchment/50">{d.quizOnce}</p>
          {failed && <p className="mt-2 text-center text-sm text-tick-red">{d.quizFailed}</p>}
          <button
            type="button"
            onClick={send}
            disabled={!picked || pending}
            className="mt-3 w-full rounded-sm bg-gold px-6 py-3 font-bold text-ink transition-opacity hover:opacity-90 disabled:bg-gold/20 disabled:text-parchment/45"
          >
            {pending ? d.quizSending : d.quizSend}
          </button>
        </>
      )}

      {answered && (
        <div className="mt-5">
          <div
            className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
              won ? "bg-tick-green/12 text-tick-green" : "bg-tick-red/12 text-tick-red"
            }`}
          >
            <span aria-hidden="true">{won ? "✓" : "✕"}</span>
            <span className="flex-1 text-sm font-bold">{won ? d.quizCorrect : d.quizWrong}</span>
            {won && <span className="text-sm">+{question.answer?.points}</span>}
          </div>
          {question.explanation && (
            <p className="mt-3 text-sm leading-8 text-parchment/70">{question.explanation}</p>
          )}
        </div>
      )}

      {!answered && question.expired && (
        <p className="mt-4 text-center text-sm text-parchment/50">{d.quizClosed}</p>
      )}
    </section>
  );
}
