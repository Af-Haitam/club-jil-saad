// دليل الإدارة — صفحةٌ تُقرأ، لا لوحةَ تحكّم.
//
// ولذلك عمودٌ واحدٌ ضيّق وخطٌّ أكبر ممّا في بقيّة الإدارة: سطرٌ من ٧٥ حرفًا
// يُقرأ، وسطرٌ يعبر الشاشة كلّها تتوه العين في رجوعها إلى أوّله.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getStaffProfile } from "@/lib/manage/queries";
import { guide, gotchas } from "@/lib/manage/guide";
import { strings } from "@/lib/strings";

export const metadata: Metadata = { title: strings.manage.guideTitle };

export default async function GuidePage() {
  // نفس بوّابة القوقعة — الدليل يشرح صلاحياتٍ لا ينبغي أن يقرأها عضو
  const me = await getStaffProfile();
  if (!me) redirect("/dashboard");
  const m = strings.manage;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="border-b border-ink-line pb-7">
        <h1 className="font-logo text-3xl leading-[1.7] text-gold">{m.guideTitle}</h1>
        <p className="mt-2 text-sm leading-8 text-parchment/65">{m.guideLead}</p>
      </header>

      {/* فهرسٌ في الأعلى: الدليل يُرجَع إليه لسؤالٍ بعينه، لا يُقرأ مرّةً من أوّله */}
      <nav aria-label={m.guideToc} className="mt-7 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {guide.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="text-parchment/70 transition-colors hover:text-gold"
          >
            <span className="me-1.5 text-xs text-gold/60">{c.n}</span>
            {c.title}
          </a>
        ))}
      </nav>

      {guide.map((c) => (
        <section key={c.id} id={c.id} className="mt-12 scroll-mt-24">
          <h2 className="flex items-baseline gap-3 font-display text-xl text-gold-light">
            <span aria-hidden="true" className="text-sm text-gold/50">
              {c.n}
            </span>
            {c.title}
          </h2>
          {c.lead && <p className="mt-2 text-sm leading-8 text-parchment/65">{c.lead}</p>}

          <div className="mt-5 space-y-5">
            {c.steps.map((s) => (
              <div key={s.title} className="border-s-2 border-ink-line ps-4">
                <h3 className="font-display text-base text-parchment">{s.title}</h3>
                <p className="mt-1 text-sm leading-8 text-parchment/70">{s.body}</p>
              </div>
            ))}
          </div>

          {/* التحذير برتقاليّ كخانة «غاب» في جدول التتبّع — نفس معنى اللون
              في كلّ الواجهة: انتبه، هنا يُفقد شيء. */}
          {c.warn && (
            <p className="mt-5 rounded-lg border border-tick-absent/40 bg-tick-absent/10 p-4 text-sm leading-8 text-tick-absent">
              {c.warn}
            </p>
          )}
        </section>
      ))}

      <section className="mt-16 rounded-xl border border-gold/25 bg-ink-soft/40 p-6">
        <h2 className="font-display text-xl text-gold">{m.guideGotchas}</h2>
        <p className="mt-1.5 text-sm leading-8 text-parchment/60">{m.guideGotchasLead}</p>
        <div className="mt-5 space-y-5">
          {gotchas.map((g) => (
            <div key={g.title}>
              <h3 className="font-display text-base text-parchment">{g.title}</h3>
              <p className="mt-1 text-sm leading-8 text-parchment/70">{g.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Link
        href="/manage"
        className="mt-12 mb-4 inline-block text-sm text-parchment/60 transition-colors hover:text-gold"
      >
        {m.guideBack}
      </Link>
    </div>
  );
}
