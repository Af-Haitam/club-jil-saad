// نقاطي والمتصدّرون — مكوّن خادم، لا تفاعل فيه.
//
// اللوحة تكشف أسماء أعضاءٍ آخرين، وهو الشيء الوحيد في لوحة العضو الذي
// يفعل ذلك. ولذلك تأتي من دالّةٍ مُعرِّفة تعيد الاسم والنقاط فقط —
// `profiles_select` تمنع العضو من قراءة صفّ غيره، وتبقى كذلك.
import type { BoardRow, QuizScore } from "@/lib/dashboard/quiz";
import { strings } from "@/lib/strings";

const d = strings.dashboard;

export default function ScoreCard({ score, board }: { score: QuizScore; board: BoardRow[] }) {
  return (
    <section className="rounded-xl border border-ink-line bg-ink-soft/40 p-6">
      <h2 className="font-display text-sm tracking-wide text-gold">{d.quizScore}</h2>

      <div className="mt-3 flex items-end gap-4">
        <span className="font-display text-4xl leading-none text-gold">{score.points}</span>
        <p className="flex-1 pb-1 text-xs text-parchment/55">
          {score.answered === 0
            ? d.quizNoneYet
            : d.quizAnsweredOf
                .replace("{n}", String(score.answered))
                .replace("{c}", String(score.correct))}
        </p>
        {score.position && (
          <div className="rounded-lg border border-gold/40 px-3 py-1.5 text-center">
            <div className="font-display text-lg text-gold-light">{score.position}</div>
            <div className="text-[10px] text-parchment/50">{d.quizRank}</div>
          </div>
        )}
      </div>

      <hr className="my-5 border-ink-line" />

      <h3 className="font-display text-sm text-gold">{d.quizBoard}</h3>
      {board.length === 0 ? (
        <p className="mt-2 text-sm leading-7 text-parchment/50">{d.quizBoardEmpty}</p>
      ) : (
        <ol className="mt-2.5">
          {board.map((r) => (
            <li
              key={r.member_id}
              className={`flex items-center gap-3 rounded-md px-2.5 py-2 ${
                // صفّي بخلفيةٍ لا بلون خط: تجده العين ولو كان في الذيل
                r.is_me ? "bg-gold/10" : ""
              }`}
            >
              <span
                className={`w-5 text-center font-display text-sm ${
                  r.position <= 3 ? "text-gold" : "text-parchment/45"
                }`}
              >
                {r.position}
              </span>
              <span
                className={`flex-1 truncate text-sm ${
                  r.is_me ? "font-bold text-gold-light" : "text-parchment"
                }`}
              >
                {r.full_name}
              </span>
              <span className="font-display text-sm text-parchment/70">{r.points}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
