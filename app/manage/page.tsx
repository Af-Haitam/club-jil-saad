import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getMembers, getHalaqat, getActiveCycle } from "@/lib/manage/queries";
import { approveMember } from "./actions";
import RecordForm from "@/components/manage/RecordForm";
import HalaqaForm from "@/components/manage/HalaqaForm";
import ExamForm from "@/components/manage/ExamForm";
import ContentForm from "@/components/manage/ContentForm";
import { strings } from "@/lib/strings";
import type { UserRole } from "@/lib/types/database";

export const metadata: Metadata = { title: `${strings.manage.title} — ${strings.auth.brand}` };

const m = strings.manage;

// أقسام الصفحة الواحدة — رقمها وعنوانها ومرساتها. الترتيب هو ترتيب الظهور.
const sectionNav = [
  { id: "record", n: "01", label: m.navRecord },
  { id: "members", n: "02", label: m.navMembers },
  { id: "halaqat", n: "03", label: m.navHalaqat },
  { id: "exams", n: "04", label: m.navExams },
  { id: "content", n: "05", label: m.navContent },
];

export default async function ManagePage() {
  const [members, halaqat, cycle] = await Promise.all([getMembers(), getHalaqat(), getActiveCycle()]);

  const pending = members.filter((x) => x.status === "pending");
  const active = members.filter((x) => x.status === "active");
  const nameById = new Map(members.map((x) => [x.id, x.full_name]));
  const roleLabel: Record<UserRole, string> = { admin: m.roleAdmin, supervisor: m.roleSupervisor, member: m.roleMember };
  const supervisorOpts = active.map((x) => ({ id: x.id, full_name: x.full_name }));

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

      {/* ── 01 · تسجيل الاستظهار ── */}
      <ManageSection id="record" n="01" title={m.navRecord} desc={m.recordSubtitle}>
        {!cycle ? (
          <Empty>{m.noCycle}</Empty>
        ) : active.length === 0 ? (
          <Empty>{m.noMembers}</Empty>
        ) : (
          <RecordForm members={supervisorOpts} weekCount={cycle.week_count} />
        )}
      </ManageSection>

      {/* ── 02 · الأعضاء ── */}
      <ManageSection id="members" n="02" title={m.navMembers}>
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
                    <form action={approveMember}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-gold-light"
                      >
                        {m.approve}
                      </button>
                    </form>
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <thead>
                    <tr className="border-b border-ink-line text-parchment/55">
                      <th className="p-2 text-start font-medium">{m.colName}</th>
                      <th className="p-2 text-start font-medium">{m.colContact}</th>
                      <th className="p-2 text-start font-medium">{m.colDay}</th>
                      <th className="p-2 text-start font-medium">{m.colMembership}</th>
                      <th className="p-2 text-start font-medium">{m.colRole}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.map((p) => (
                      <tr key={p.id} className="border-b border-ink-line/50">
                        <td className="p-2 text-parchment">{p.full_name}</td>
                        <td className="p-2 text-parchment/60" dir="ltr">
                          {p.phone ?? ""}
                        </td>
                        <td className="p-2 text-parchment/70">{strings.weekdays[p.session_day ?? 0]}</td>
                        <td className="p-2 text-parchment/70">{p.in_club ? m.mClub : m.mHifz}</td>
                        <td className="p-2 text-parchment/70">{roleLabel[p.role]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </ManageSection>

      {/* ── 03 · الحلقات ── */}
      <ManageSection id="halaqat" n="03" title={m.navHalaqat} desc={m.halaqatSubtitle}>
        <div className="flex flex-col gap-8">
          <HalaqaForm supervisors={supervisorOpts} />
          <div>
            <h3 className="mb-4 font-bold text-lg text-gold-light">{m.halaqatTitle}</h3>
            {halaqat.length === 0 ? (
              <Empty>{m.halaqatNone}</Empty>
            ) : (
              <ul className="flex flex-col gap-3">
                {halaqat.map((h) => (
                  <li key={h.id} className="rounded-lg border border-ink-line bg-ink-soft/40 p-4">
                    <p className="font-bold text-parchment">{h.name}</p>
                    <p className="text-sm text-parchment/60">
                      {h.supervisor_id
                        ? `${m.halaqaSupervisor}: ${nameById.get(h.supervisor_id) ?? ""}`
                        : m.chooseSupervisor}
                      {h.schedule_note ? ` · ${h.schedule_note}` : ""}
                    </p>
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
        <ContentForm />
      </ManageSection>
    </div>
  );
}

// رأس قسم موحّد: رقم + عنوان + وصف اختياري — نفس إيقاع عناوين الصفحة الرئيسية.
function ManageSection({
  id,
  n,
  title,
  desc,
  children,
}: {
  id: string;
  n: string;
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <header className="mb-6 flex items-baseline gap-4">
        <span className="font-display text-lg tabular-nums text-gold/60" aria-hidden="true">
          {n}
        </span>
        <div>
          <h2 className="font-display text-2xl text-parchment">{title}</h2>
          {desc && <p className="mt-1 text-sm text-parchment/55">{desc}</p>}
        </div>
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
