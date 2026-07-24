import type { HifzProgress } from "@/lib/types/database";
import { progressPercent } from "@/lib/dashboard/hifz";
import { strings } from "@/lib/strings";

export default function PositionCard({
  progress,
  surahs,
}: {
  progress: HifzProgress | null;
  surahs: Record<number, string>;
}) {
  const d = strings.dashboard;
  const hasData =
    !!progress &&
    (progress.current_surah != null ||
      progress.memorized_pages != null ||
      progress.memorized_juz != null);
  const pct = progressPercent(progress);
  const juz = progress?.memorized_juz != null ? Number(progress.memorized_juz) : 0;
  const pages = progress?.memorized_pages ?? 0;

  return (
    <section className="rounded-xl border border-ink-line bg-ink-soft/40 p-6">
      <h2 className="mb-4 font-bold text-lg text-gold-light">{d.positionTitle}</h2>
      {!hasData ? (
        <p className="text-parchment/60">{d.positionNone}</p>
      ) : (
        <>
          {progress?.current_surah != null && (
            <p className="text-parchment/85">
              {d.positionAt}:{" "}
              <span className="font-bold text-parchment">
                {d.surahWord} {surahs[progress.current_surah] ?? `#${progress.current_surah}`}
                {progress.current_ayah != null ? ` — ${d.ayahWord} ${progress.current_ayah}` : ""}
              </span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-parchment/55">{d.juzLabel}: </span>
              <span className="font-bold text-gold-light">{juz} / 30</span>
            </div>
            <div>
              <span className="text-parchment/55">{d.pagesLabel}: </span>
              <span className="font-bold text-gold-light">{pages} / 604</span>
            </div>
          </div>
          <div
            className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink-line"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-l from-gold-deep via-gold to-gold-light"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-parchment/50">{pct}%</p>
        </>
      )}
    </section>
  );
}
