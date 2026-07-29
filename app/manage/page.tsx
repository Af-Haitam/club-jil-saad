import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  getStaffProfile,
  getMembers,
  getHalaqat,
  getActiveCycle,
  getEnrollments,
  getProgress,
  getCycleSessions,
} from "@/lib/manage/queries";
import { approveMember, rejectMember } from "./actions";
import TrackingSheet from "@/components/manage/TrackingSheet";
import HalaqaForm from "@/components/manage/HalaqaForm";
import HalaqaEditForm from "@/components/manage/HalaqaEditForm";
import MemberForm from "@/components/manage/MemberForm";
import SheetSyncButton from "@/components/manage/SheetSyncButton";
import SiteEditor from "@/components/manage/SiteEditor";
import { sheetConfig } from "@/lib/manage/google-sheet";
import { getAllSections, sectionsAreSeeded } from "@/lib/site/queries";
import { recentErrors } from "@/lib/ops/log";
import ErrorLog from "@/components/manage/ErrorLog";
import ExamForm from "@/components/manage/ExamForm";
import ContentForm from "@/components/manage/ContentForm";
import QuestionForm from "@/components/manage/QuestionForm";
import { strings } from "@/lib/strings";
import type { UserRole, Profile, HifzProgress, Halaqa } from "@/lib/types/database";

export const metadata: Metadata = { title: `${strings.manage.title} — ${strings.auth.brand}` };

const m = strings.manage;

// أقسام الصفحة الواحدة — رقمها وعنوانها ومرساتها. الترتيب هو ترتيب الظهور.
const sectionNav = [
  { id: "record", n: "01", label: m.navRecord },
  { id: "members", n: "02", label: m.navMembers },
  { id: "halaqat", n: "03", label: m.navHalaqat },
  { id: "exams", n: "04", label: m.navExams },
  { id: "content", n: "05", label: m.navContent },
  { id: "questions", n: "06", label: m.navQuestions },
  { id: "site", n: "07", label: m.navSite },
];

const roleLabel: Record<UserRole, string> = { admin: m.roleAdmin, supervisor: m.roleSupervisor, member: m.roleMember };

export default async function ManagePage() {
  const [me, members, halaqat, cycle, enrollments, progress] = await Promise.all([
    getStaffProfile(),
    getMembers(),
    getHalaqat(),
    getActiveCycle(),
    getEnrollments(),
    getProgress(),
  ]);

  // القوقعة تُعيد غير الطاقم قبل الوصول إلى هنا؛ هذا للتحقق من النوع فقط.
  if (!me) return null;
  const isAdmin = me.role === "admin";
  const sheet = sheetConfig();

  // تابع للدورة، فلا يمكن ضمّه إلى الدفعة الأولى.
  const sessions = cycle ? await getCycleSessions(cycle.id) : [];

  // محرّر الصفحة الرئيسية وسجلّ الأعطال — للمدير وحده، فلا نُتعب القاعدة
  // بهما مع كل مشرف.
  const [siteSections, seeded, errors] = isAdmin
    ? await Promise.all([getAllSections(), sectionsAreSeeded(), recentErrors()])
    : [[], false, { ready: false, rows: [] }];

  const pending = members.filter((x) => x.status === "pending");
  const active = members.filter((x) => x.status === "active");
  const suspended = members.filter((x) => x.status === "suspended");
  const nameById = new Map(members.map((x) => [x.id, x.full_name]));
  const supervisorOpts = active.map((x) => ({ id: x.id, full_name: x.full_name }));
  const halaqaOpts = halaqat.map((h) => ({ id: h.id, name: h.name }));

  // العضو في حلقة نشطة واحدة على الأكثر — الخريطتان تُغنيان عن استعلام لكل صفّ.
  const halaqaOf = new Map(enrollments.map((e) => [e.member_id, e.halaqa_id]));
  const halaqaNameById = new Map(halaqat.map((h) => [h.id, h.name]));
  const progressOf = new Map(progress.map((p) => [p.member_id, p]));
  const rosterOf = new Map<string, Profile[]>(halaqat.map((h) => [h.id, []]));
  for (const p of active) {
    const hid = halaqaOf.get(p.id);
    if (hid) rosterOf.get(hid)?.push(p);
  }

  const rowProps = (p: Profile) => ({
    member: p,
    progress: (progressOf.get(p.id) ?? null) as HifzProgress | null,
    halaqaName: halaqaNameById.get(halaqaOf.get(p.id) ?? "") ?? null,
    halaqaId: halaqaOf.get(p.id) ?? "",
    halaqat: halaqaOpts,
    isSelf: p.id === me.id,
    isAdmin,
  });

  return (
    <div className="flex flex-col gap-16 pb-12">
      {/* ── المقدّمة: إحصاءات + روابط قفز إلى الأقسام (كإيقاع الصفحة الرئيسية) ── */}
      <section className="border-b border-ink-line pb-10">
        <p className="text-sm tracking-widest text-gold-light/80">{m.title}</p>
        <h1 className="mt-2 max-w-2xl font-display text-2xl leading-[1.7] text-parchment sm:text-3xl">
          {m.hubSubtitle}
        </h1>

        <div className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
          <Stat n={members.length} label={m.statMembers} />
          <Stat n={pending.length} label={m.statPending} highlight={pending.length > 0} />
          <Stat n={halaqat.length} label={m.statHalaqat} />
        </div>

        <nav className="mt-8 flex flex-wrap gap-2.5" aria-label={m.title}>
          {sectionNav.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-ink-line bg-ink-soft/50 px-4 py-1.5 text-sm text-parchment/80 transition-colors hover:border-gold/60 hover:text-gold-light"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </section>

      {/* ── 01 · تسجيل الاستظهار — جدول التتبع التفاعلي ── */}
      <ManageSection id="record" n="01" title={m.navRecord} desc={m.recordSubtitle}>
        {!cycle ? (
          <Empty>{m.noCycle}</Empty>
        ) : active.length === 0 ? (
          <Empty>{m.noMembers}</Empty>
        ) : (
          <TrackingSheet
            members={active}
            sessions={sessions}
            weekCount={cycle.week_count}
            startDate={cycle.start_date}
            canEditWeeks={isAdmin}
          />
        )}
      </ManageSection>

      {/* ── 02 · الأعضاء ── */}
      <ManageSection
        id="members"
        n="02"
        title={m.navMembers}
        action={
          !isAdmin ? null : sheet.configured ? (
            <SheetSyncButton sheetUrl={sheet.url} />
          ) : (
            <p className="text-xs text-parchment/45">{m.sheetUnconfigured}</p>
          )
        }
      >
        <div className="flex flex-col gap-9">
          <div>
            <h3 className="mb-4 font-bold text-lg text-gold-light">{m.pendingTitle}</h3>
            {pending.length === 0 ? (
              <Empty>{m.pendingNone}</Empty>
            ) : (
              <ul className="flex flex-col gap-3">
                {pending.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/30 bg-gold/[0.05] p-4"
                  >
                    <div>
                      <p className="font-bold text-parchment">{p.full_name}</p>
                      <p className="text-sm text-parchment/55" dir="ltr">
                        {[p.phone, p.email].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-xs text-parchment/45">
                        {p.in_club ? m.mClub : m.mHifz} · {strings.weekdays[p.session_day ?? 0]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={approveMember}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-gold-light"
                        >
                          {m.approve}
                        </button>
                      </form>
                      {isAdmin && (
                        <form action={rejectMember}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="rounded-sm border border-ink-line px-4 py-2 text-sm text-parchment/70 transition-colors hover:border-tick-red hover:text-tick-red"
                          >
                            {m.reject}
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-4 font-bold text-lg text-gold-light">{m.activeTitle}</h3>
            {active.length === 0 ? (
              <Empty>{m.dash}</Empty>
            ) : (
              <MemberList>
                {active.map((p) => (
                  <MemberRow key={p.id} {...rowProps(p)} />
                ))}
              </MemberList>
            )}
          </div>

          {suspended.length > 0 && (
            <div>
              <h3 className="mb-4 font-bold text-lg text-parchment/60">{m.suspendedGroup}</h3>
              <MemberList>
                {suspended.map((p) => (
                  <MemberRow key={p.id} {...rowProps(p)} />
                ))}
              </MemberList>
            </div>
          )}
        </div>
      </ManageSection>

      {/* ── 03 · الحلقات ── */}
      <ManageSection id="halaqat" n="03" title={m.navHalaqat} desc={m.halaqatSubtitle}>
        <div className="flex flex-col gap-8">
          {isAdmin && <HalaqaForm supervisors={supervisorOpts} />}
          <div>
            <h3 className="mb-4 font-bold text-lg text-gold-light">{m.halaqatTitle}</h3>
            {halaqat.length === 0 ? (
              <Empty>{m.halaqatNone}</Empty>
            ) : (
              <ul className="flex flex-col gap-3">
                {halaqat.map((h) => (
                  <li key={h.id} className="overflow-hidden rounded-lg border border-ink-line bg-ink-soft/40">
                    <HalaqaCard
                      halaqa={h}
                      supervisorName={h.supervisor_id ? nameById.get(h.supervisor_id) ?? null : null}
                      roster={rosterOf.get(h.id) ?? []}
                      supervisors={supervisorOpts}
                      isAdmin={isAdmin}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </ManageSection>

      {/* ── 04 · الاختبارات ── */}
      <ManageSection id="exams" n="04" title={m.navExams}>
        <ExamForm
          members={active.map((x) => ({ id: x.id, name: x.full_name }))}
          halaqat={halaqat.map((h) => ({ id: h.id, name: h.name }))}
        />
      </ManageSection>

      {/* ── 05 · الإعلانات والتذكيرات ── */}
      <ManageSection id="content" n="05" title={m.navContent}>
        <ContentForm
          isAdmin={isAdmin}
          halaqat={halaqaOpts}
          // RLS تُسلّم للمشرف طلابه وحدهم أصلًا؛ نحذف نفسه فقط — لا أحد
          // يُرسل رسالة خاصة إلى نفسه.
          members={active
            .filter((p) => p.id !== me.id)
            .map((p) => ({ id: p.id, full_name: p.full_name }))}
        />
      </ManageSection>

      {/* ── 06 · الأسئلة ── */}
      <ManageSection id="questions" n="06" title={m.navQuestions} desc={m.questionsTitle}>
        <QuestionForm
          isAdmin={isAdmin}
          halaqat={halaqaOpts}
          members={active
            .filter((p) => p.id !== me.id)
            .map((p) => ({ id: p.id, full_name: p.full_name }))}
        />
      </ManageSection>

      {/* ── 07 · محرّر الصفحة الرئيسية (للمدير وحده) ── */}
      {isAdmin && (
        <ManageSection id="site" n="07" title={m.navSite} desc={m.siteSubtitle}>
          <SiteEditor sections={siteSections} seeded={seeded} />
        </ManageSection>
      )}

      {/* ── 08 · سجلّ الأعطال (للمدير وحده) ──
          في الذيل عمدًا: يُقصد حين يُشتبه في عطل، ولا يُقرأ كلّ يوم. */}
      {isAdmin && (
        <ManageSection id="errors" n="08" title={m.errorsTitle} desc={m.errorsLead}>
          <ErrorLog rows={errors.rows} ready={errors.ready} />
        </ManageSection>
      )}
    </div>
  );
}

// ─── قائمة الأعضاء ─────────────────────────────────────────────────────

function MemberList({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink-line">
      <div className="hidden border-b border-ink-line bg-ink-soft/60 px-4 py-2 text-xs text-parchment/55 sm:grid sm:grid-cols-[1.7fr_0.9fr_1.1fr_0.8fr_auto] sm:gap-3">
        <span>{m.colName}</span>
        <span>{m.colDay}</span>
        <span>{m.colHalaqa}</span>
        <span>{m.colRole}</span>
        <span aria-hidden="true" />
      </div>
      <ul>{children}</ul>
    </div>
  );
}

/**
 * صفّ عضو — يتّسع في مكانه ليكشف نموذج التعديل، بلا جافاسكربت للفتح والإغلاق.
 * غير المدير (المشرف) يرى الصفّ للقراءة فقط.
 */
function MemberRow({
  member,
  progress,
  halaqaName,
  halaqaId,
  halaqat,
  isSelf,
  isAdmin,
}: {
  member: Profile;
  progress: HifzProgress | null;
  halaqaName: string | null;
  halaqaId: string;
  halaqat: { id: string; name: string }[];
  isSelf: boolean;
  isAdmin: boolean;
}) {
  const day = member.session_day === null ? m.dash : strings.weekdays[member.session_day];
  const halaqa = halaqaName ?? m.noHalaqa;
  const role = roleLabel[member.role];

  const summary = (
    <>
      <span className="font-medium text-parchment">{member.full_name}</span>
      {isAdmin && (
        <span className="col-start-2 row-start-1 justify-self-end text-xs text-gold/75 sm:col-start-5">
          {m.editMember}
        </span>
      )}
      <span className="col-span-2 text-sm text-parchment/55 sm:hidden">{[day, halaqa, role].join(" · ")}</span>
      <span className="hidden text-sm text-parchment/60 sm:col-start-2 sm:row-start-1 sm:block">{day}</span>
      <span className="hidden text-sm text-parchment/60 sm:col-start-3 sm:row-start-1 sm:block">{halaqa}</span>
      <span className="hidden text-sm text-parchment/60 sm:col-start-4 sm:row-start-1 sm:block">{role}</span>
    </>
  );

  const grid =
    "grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[1.7fr_0.9fr_1.1fr_0.8fr_auto]";

  if (!isAdmin) {
    return (
      <li className="border-b border-ink-line/50 last:border-b-0">
        <div className={grid}>{summary}</div>
      </li>
    );
  }

  return (
    <li className="border-b border-ink-line/50 last:border-b-0">
      <details>
        <summary
          className={`${grid} cursor-pointer list-none transition-colors hover:bg-ink-soft/40 [&::-webkit-details-marker]:hidden`}
        >
          {summary}
        </summary>
        <MemberForm member={member} progress={progress} halaqat={halaqat} halaqaId={halaqaId} isSelf={isSelf} />
      </details>
    </li>
  );
}

// ─── بطاقة حلقة: المشرف والطلبة، وللمدير نموذج تعديل يتّسع في مكانه ──────

function HalaqaCard({
  halaqa,
  supervisorName,
  roster,
  supervisors,
  isAdmin,
}: {
  halaqa: Halaqa;
  supervisorName: string | null;
  roster: Profile[];
  supervisors: { id: string; full_name: string }[];
  isAdmin: boolean;
}) {
  const head = (
    <>
      <div>
        <p className="font-bold text-parchment">{halaqa.name}</p>
        <p className="text-sm text-parchment/60">
          {supervisorName ? `${m.halaqaSupervisor}: ${supervisorName}` : m.chooseSupervisor}
          {halaqa.schedule_note ? ` · ${halaqa.schedule_note}` : ""}
          {` · ${roster.length} ${m.halaqaCount}`}
        </p>
      </div>
      {isAdmin && <span className="text-xs text-gold/75">{m.halaqaEdit}</span>}
    </>
  );

  const body = (
    <div className="border-t border-ink-line px-5 py-4">
      <h4 className="mb-2 font-bold text-sm text-gold-light">{m.halaqaRoster}</h4>
      {roster.length === 0 ? (
        <p className="text-sm text-parchment/55">{m.halaqaEmpty}</p>
      ) : (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-parchment/70">
          {roster.map((p) => (
            <li key={p.id}>{p.full_name}</li>
          ))}
        </ul>
      )}
    </div>
  );

  if (!isAdmin) {
    return (
      <>
        <div className="flex items-center justify-between gap-3 p-4">{head}</div>
        {body}
      </>
    );
  }

  return (
    <details>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 transition-colors hover:bg-ink-soft/60 [&::-webkit-details-marker]:hidden">
        {head}
      </summary>
      {body}
      <HalaqaEditForm halaqa={halaqa} supervisors={supervisors} />
    </details>
  );
}

// رأس قسم موحّد: رقم + عنوان + وصف اختياري — نفس إيقاع عناوين الصفحة الرئيسية.
function ManageSection({
  id,
  n,
  title,
  desc,
  action,
  children,
}: {
  id: string;
  n: string;
  title: string;
  desc?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-lg tabular-nums text-gold/60" aria-hidden="true">
            {n}
          </span>
          <div>
            <h2 className="font-display text-2xl text-parchment">{title}</h2>
            {desc && <p className="mt-1 text-sm text-parchment/55">{desc}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Stat({ n, label, highlight }: { n: number; label: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-3xl font-bold tabular-nums ${highlight ? "text-gold" : "text-gold-light"}`}>{n}</span>
      <span className="text-sm text-parchment/60">{label}</span>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-parchment/60">{children}</p>;
}
