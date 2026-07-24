import type { Exam } from "@/lib/types/database";
import { formatRange, formatDate, daysUntil } from "@/lib/dashboard/hifz";
import { strings } from "@/lib/strings";

export default function ExamCard({
  exam,
  surahs,
}: {
  exam: Exam | null;
  surahs: Record<number, string>;
}) {
  const d = strings.dashboard;

  if (!exam) {
    return (
      <section className="rounded-xl border border-ink-line bg-ink-soft/40 p-6">
        <h2 className="mb-3 font-bold text-lg text-gold-light">{d.examTitle}</h2>
        <p className="text-parchment/60">{d.examNone}</p>
      </section>
    );
  }

  const days = exam.exam_date ? daysUntil(exam.exam_date) : null;
  const countdown =
    days == null ? null : days <= 0 ? d.examToday : `${d.examRemaining} ${days} ${d.examDays}`;
  const portion = formatRange(exam, surahs);

  return (
    <section className="rounded-xl border border-gold/30 bg-gold/[0.06] p-6">
      <h2 className="mb-3 font-bold text-lg text-gold-light">{d.examTitle}</h2>
      <p className="font-bold text-parchment">{exam.title}</p>
      {exam.exam_date && (
        <p className="mt-1 text-sm text-parchment/75">
          {formatDate(exam.exam_date)}
          {exam.exam_time ? ` — ${exam.exam_time.slice(0, 5)}` : ""}
        </p>
      )}
      {countdown && (
        <p className="mt-3 inline-block rounded-full bg-gold/15 px-3 py-1 text-sm font-medium text-gold-light">
          {countdown}
        </p>
      )}
      {portion && (
        <p className="mt-3 text-sm">
          <span className="text-parchment/55">{d.examPortion}: </span>
          <span className="text-parchment/90">{portion}</span>
        </p>
      )}
      {exam.location && (
        <p className="mt-1 text-sm">
          <span className="text-parchment/55">{d.examLocation}: </span>
          <span className="text-parchment/90">{exam.location}</span>
        </p>
      )}
    </section>
  );
}
