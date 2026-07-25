"use client";

// جدول التتبع التفاعلي — نفس تخطيط الورقة: صفّ لكل طالب، عمود لكل أسبوع.
// تُضغط الخانة فتظهر الألوان بمعانيها، ويُختار لون فيُحفظ فورًا.
import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { setCellStatus, setCycleWeeks } from "@/app/manage/actions";
import RecordForm from "@/components/manage/RecordForm";
import { statusMeta, STATUS_ORDER } from "@/lib/dashboard/hifz";
import { strings } from "@/lib/strings";
import type { Profile, WeeklySession, SessionStatus } from "@/lib/types/database";

const m = strings.manage;
const d = strings.dashboard;

const STATUS_LABEL: Record<SessionStatus, string> = {
  green: d.stGreen,
  red: d.stRed,
  absent: d.stAbsent,
  excused: d.stExcused,
  pending: d.stPending,
};

const key = (memberId: string, week: number) => `${memberId}:${week}`;

type Picker = { memberId: string; memberName: string; week: number; x: number; y: number };
type Detail = { memberId: string; week: number };

export default function TrackingSheet({
  members,
  sessions,
  weekCount,
  canEditWeeks = false,
}: {
  members: Profile[];
  sessions: WeeklySession[];
  weekCount: number;
  /** عدد الأسابيع خاصية الدورة كلها — للمدير وحده، لا لكل مشرف. */
  canEditWeeks?: boolean;
}) {
  const weeks = useMemo(() => Array.from({ length: weekCount }, (_, i) => i + 1), [weekCount]);

  // الحالة الحقيقية من الخادم، ثمّ طبقة تفاؤلية فوقها حتى تصل الاستجابة.
  const serverMap = useMemo(() => {
    const map = new Map<string, SessionStatus>();
    for (const s of sessions) map.set(key(s.member_id, s.week_number), s.status);
    return map;
  }, [sessions]);

  const [statuses, addOptimistic] = useOptimistic(
    serverMap,
    (state: Map<string, SessionStatus>, patch: { memberId: string; week: number; status: SessionStatus }) => {
      const next = new Map(state);
      next.set(key(patch.memberId, patch.week), patch.status);
      return next;
    }
  );

  const [, startTransition] = useTransition();
  const [picker, setPicker] = useState<Picker | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [failed, setFailed] = useState(false);
  const detailRef = useRef<HTMLDivElement | null>(null);

  // الترتيب: اليوم ثمّ الاسم — فطلبة الثلاثاء يجلسون معًا كما في الحصّة.
  const rows = useMemo(
    () =>
      [...members].sort(
        (a, b) => (a.session_day ?? 9) - (b.session_day ?? 9) || a.full_name.localeCompare(b.full_name, "ar")
      ),
    [members]
  );

  function choose(status: SessionStatus) {
    if (!picker) return;
    const { memberId, week } = picker;
    setPicker(null);
    setFailed(false);
    startTransition(async () => {
      addOptimistic({ memberId, week, status });
      const res = await setCellStatus(memberId, week, status);
      if (!res.ok) setFailed(true);
    });
  }

  function openDetail() {
    if (!picker) return;
    setDetail({ memberId: picker.memberId, week: picker.week });
    setPicker(null);
    // نؤجّل التمرير حتى يُركَّب النموذج بقيمه الجديدة.
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  }

  return (
    <div className="flex flex-col gap-6">
      {failed && (
        <p role="alert" className="rounded-md border border-tick-red/40 bg-tick-red/10 p-3 text-sm text-tick-red">
          {m.gridSaveFailed}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Legend />
        {canEditWeeks && <WeekCount weekCount={weekCount} />}
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-line">
        <table className="min-w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-ink-soft/60 text-parchment/55">
              <th scope="col" className="sticky start-0 z-20 border-b border-ink-line bg-ink-soft px-3 py-2 text-start font-medium">
                {m.colName}
              </th>
              <th scope="col" className="border-b border-ink-line px-2 py-2 font-medium">
                {m.colDay}
              </th>
              <th scope="col" className="border-b border-ink-line px-3 py-2 text-start font-medium">
                {m.colAmount}
              </th>
              {weeks.map((w) => (
                <th key={w} scope="col" className="border-b border-ink-line px-1 py-2 font-medium tabular-nums">
                  {w}
                </th>
              ))}
              <th scope="col" className="border-b border-ink-line px-3 py-2 font-medium">
                {m.colExam}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="even:bg-ink-soft/20">
                <th
                  scope="row"
                  className="sticky start-0 z-10 border-b border-ink-line/50 bg-ink px-3 py-1.5 text-start font-medium text-parchment"
                >
                  {p.full_name}
                </th>
                <td className="border-b border-ink-line/50 px-2 py-1.5 text-center text-parchment/55">
                  {p.session_day === null ? m.dash : strings.weekdaysShort[p.session_day]}
                </td>
                <td className="border-b border-ink-line/50 px-3 py-1.5 text-parchment/55">
                  {strings.hifzAmounts.find((a) => a.value === p.weekly_amount)?.label ?? m.dash}
                </td>
                {weeks.map((w) => {
                  const st = statuses.get(key(p.id, w)) ?? "pending";
                  const meta = statusMeta[st];
                  return (
                    <td key={w} className="border-b border-ink-line/50 px-1 py-1.5 text-center">
                      <button
                        type="button"
                        aria-label={`${p.full_name} — ${d.weekWord} ${w} — ${STATUS_LABEL[st]}`}
                        onClick={(e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          setPicker({
                            memberId: p.id,
                            memberName: p.full_name,
                            week: w,
                            x: r.left + r.width / 2,
                            y: r.bottom,
                          });
                        }}
                        className={`size-8 rounded-sm border leading-none transition-transform duration-150 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${meta.cell} ${meta.text}`}
                      >
                        <span aria-hidden="true">{meta.glyph}</span>
                      </button>
                    </td>
                  );
                })}
                <td className="border-b border-ink-line/50 px-3 py-1.5 text-center text-parchment/35">{m.dash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {picker && (
        <StatusPicker picker={picker} onPick={choose} onDetail={openDetail} onClose={() => setPicker(null)} />
      )}

      <div ref={detailRef}>
        <RecordForm
          key={detail ? `${detail.memberId}:${detail.week}` : "blank"}
          members={rows.map((p) => ({ id: p.id, full_name: p.full_name }))}
          weekCount={weekCount}
          defaultMemberId={detail?.memberId ?? ""}
          defaultWeek={detail?.week ?? 1}
        />
      </div>
    </div>
  );
}

/** طول الدورة: زرّان ورقم. التقليص يُرفض إن كان الأسبوع الأخير يحمل تسجيلات. */
function WeekCount({ weekCount }: { weekCount: number }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");

  const change = (next: number) => {
    setErr("");
    startTransition(async () => {
      const res = await setCycleWeeks(next);
      if (!res.ok) setErr(res.error ?? "");
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-parchment/55">{m.weeksLabel}</span>
        <button
          type="button"
          aria-label={m.weekRemove}
          title={m.weekRemove}
          disabled={pending || weekCount <= 1}
          onClick={() => change(weekCount - 1)}
          className="size-7 rounded-sm border border-ink-line text-parchment/70 transition-colors hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-bold tabular-nums text-gold-light">{weekCount}</span>
        <button
          type="button"
          aria-label={m.weekAdd}
          title={m.weekAdd}
          disabled={pending || weekCount >= 53}
          onClick={() => change(weekCount + 1)}
          className="size-7 rounded-sm border border-ink-line text-parchment/70 transition-colors hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
        >
          +
        </button>
      </div>
      {err && (
        <p role="alert" className="max-w-xs text-end text-xs text-tick-red">
          {err}
        </p>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-parchment/55">
      {STATUS_ORDER.map((st) => (
        <span key={st} className="inline-flex items-center gap-1.5">
          <span className={`inline-block size-2.5 rounded-sm ${statusMeta[st].dot}`} />
          {STATUS_LABEL[st]}
        </span>
      ))}
    </div>
  );
}

/**
 * لوحة الألوان — `fixed` لا `absolute`: الجدول يمرّر أفقيًّا، وأي عنصر بداخله
 * يُقصّ عند حافّته. نحسب الموضع من مستطيل الخانة ونُبقيه داخل الشاشة.
 */
function StatusPicker({
  picker,
  onPick,
  onDetail,
  onClose,
}: {
  picker: Picker;
  onPick: (s: SessionStatus) => void;
  onDetail: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const margin = 8;

    // نفضّل أسفل الخانة، فإن لم يتّسع قلبناها فوقها.
    const below = picker.y + margin;
    const preferred = below + height > window.innerHeight ? picker.y - height - margin * 3 : below;

    // ثمّ حبس نهائي داخل الشاشة: الخانة نفسها قد تكون خارج المشهد (صفّ أسفل
    // الطيّة)، وحينها لا يكفي القلب — تظلّ اللوحة خارج الشاشة بلا هذا السطر.
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    const top = Math.min(Math.max(margin, preferred), maxTop);
    const left = Math.min(Math.max(margin, picker.x - width / 2), window.innerWidth - width - margin);
    setPos({ top, left });
  }, [picker]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    // التمرير يزيح الخانة عن اللوحة، فنغلقها بدل أن تطفو في غير مكانها.
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} role="presentation" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={m.gridPick}
        style={{
          top: pos?.top ?? picker.y + 8,
          left: pos?.left ?? picker.x,
          visibility: pos ? "visible" : "hidden",
          // شاشة قصيرة جدًّا (هاتف بالعرض): تمرّر اللوحة داخل نفسها بدل أن تفيض.
          maxHeight: "calc(100dvh - 1rem)",
        }}
        className="fixed z-50 w-56 overflow-y-auto rounded-lg border border-ink-line bg-ink-soft p-2 shadow-xl shadow-ink/60"
      >
        <p className="truncate px-2 pb-1.5 pt-1 text-xs text-parchment/50">
          {picker.memberName} · {d.weekWord} {picker.week}
        </p>
        {STATUS_ORDER.map((st, i) => (
          <button
            key={st}
            type="button"
            autoFocus={i === 0}
            onClick={() => onPick(st)}
            className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-start text-sm text-parchment/90 transition-colors hover:bg-gold/15 focus-visible:bg-gold/15 focus-visible:outline-none"
          >
            <span
              className={`inline-flex size-5 items-center justify-center rounded-sm border text-xs leading-none ${statusMeta[st].cell} ${statusMeta[st].text}`}
              aria-hidden="true"
            >
              {statusMeta[st].glyph}
            </span>
            {STATUS_LABEL[st]}
          </button>
        ))}
        <button
          type="button"
          onClick={onDetail}
          className="mt-1 w-full border-t border-ink-line px-2 pb-1 pt-2 text-start text-xs text-gold/80 transition-colors hover:text-gold"
        >
          {m.gridDetails}
        </button>
      </div>
    </>
  );
}
