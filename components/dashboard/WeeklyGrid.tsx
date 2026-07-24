"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ProgramCycle, WeeklySession, SessionStatus } from "@/lib/types/database";
import { statusMeta, STATUS_ORDER, formatRange, formatDate } from "@/lib/dashboard/hifz";
import { strings } from "@/lib/strings";

const d = strings.dashboard;

const STATUS_LABEL: Record<SessionStatus, string> = {
  green: d.stGreen,
  red: d.stRed,
  absent: d.stAbsent,
  excused: d.stExcused,
  pending: d.stPending,
};

type Props = {
  cycle: ProgramCycle | null;
  sessions: WeeklySession[];
  surahs: Record<number, string>;
};

export default function WeeklyGrid({ cycle, sessions, surahs }: Props) {
  const [openWeek, setOpenWeek] = useState<number | null>(null);

  if (!cycle) {
    return (
      <section className="rounded-xl border border-ink-line bg-ink-soft/40 p-6">
        <h2 className="font-bold text-lg text-gold-light">{d.gridTitle}</h2>
        <p className="mt-3 text-parchment/60">{d.noCycle}</p>
      </section>
    );
  }

  const byWeek = new Map(sessions.map((s) => [s.week_number, s]));
  const weeks = Array.from({ length: cycle.week_count }, (_, i) => i + 1);
  const active = openWeek != null ? byWeek.get(openWeek) ?? null : null;

  return (
    <section className="rounded-xl border border-ink-line bg-ink-soft/40 p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-bold text-lg text-gold-light">{d.gridTitle}</h2>
        <span className="text-xs text-parchment/50">{cycle.name}</span>
      </div>
      <p className="mt-1 mb-5 text-sm text-parchment/55">{d.gridSubtitle}</p>

      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {weeks.map((w) => {
          const s = byWeek.get(w);
          const st: SessionStatus = s?.status ?? "pending";
          const meta = statusMeta[st];
          return (
            <button
              key={w}
              type="button"
              onClick={() => setOpenWeek(w)}
              aria-label={`${d.weekWord} ${w} — ${STATUS_LABEL[st]}`}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border p-1 text-center transition-transform duration-150 hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${meta.cell}`}
            >
              <span className="text-[0.7rem] text-parchment/55">
                {d.weekWord} {w}
              </span>
              <span className={`text-2xl leading-none ${meta.text}`} aria-hidden="true">
                {meta.glyph}
              </span>
              <span className={`text-[0.65rem] ${meta.text}`}>{STATUS_LABEL[st]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center rounded-lg border border-dashed border-gold/30 bg-gold/[0.05] py-2.5 text-sm text-gold-light/90">
        {d.examCell}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-parchment/55">
        {STATUS_ORDER.map((st) => (
          <span key={st} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${statusMeta[st].dot}`} />
            {STATUS_LABEL[st]}
          </span>
        ))}
      </div>

      {openWeek != null && (
        <DetailModal week={openWeek} session={active} surahs={surahs} onClose={() => setOpenWeek(null)} />
      )}
    </section>
  );
}

function DetailModal({
  week,
  session,
  surahs,
  onClose,
}: {
  week: number;
  session: WeeklySession | null;
  surahs: Record<number, string>;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const empty = !session || session.status === "pending";
  const range = session ? formatRange(session, surahs) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-5 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-xl border border-ink-line bg-ink-soft p-6"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-gold-light">
            {d.weekWord} {week}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={d.detailClose}
            autoFocus
            className="text-parchment/50 transition-colors hover:text-gold"
          >
            ✕
          </button>
        </div>

        {empty || !session ? (
          <p className="text-parchment/60">{d.detailNone}</p>
        ) : (
          <dl className="flex flex-col gap-3 text-sm">
            <Row label={d.detailStatus}>
              <span className={statusMeta[session.status].text}>{STATUS_LABEL[session.status]}</span>
            </Row>
            {range && <Row label={d.detailRange}>{range}</Row>}
            {session.hizb_number != null && <Row label={d.detailHizb}>{session.hizb_number}</Row>}
            {session.mistakes_count != null && <Row label={d.detailMistakes}>{session.mistakes_count}</Row>}
            {session.scheduled_date && <Row label={d.detailDate}>{formatDate(session.scheduled_date)}</Row>}
            {session.notes && <Row label={d.detailNotes}>{session.notes}</Row>}
          </dl>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-parchment/55">{label}</dt>
      <dd className="text-end text-parchment/90">{children}</dd>
    </div>
  );
}
