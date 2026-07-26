// صفحة تثبيت التطبيق.
//
// وظيفتها الحقيقية ليست الزرّ بل الشاشتان: أندرويد يعترض على كلّ ملفٍ من
// خارج المتجر، ومن رأى الاعتراض قبل ظهوره تجاوزه، ومن فوجئ به ألغى التثبيت.
// ولذلك تُرسم الشاشتان هنا **بلون الهاتف لا بلون النادي** — رقٌّ فاتح فوق
// الحبر — كي تُقرأ فورًا على أنّها كلام الهاتف، لا كلامنا.
import type { Metadata } from "next";
import { statSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import GeoPattern from "@/components/GeoPattern";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: `${strings.app.title} — ${strings.auth.brand}`,
  description: strings.app.subtitle,
};

// لا شيء في الصفحة يتغيّر بين زائرٍ وآخر، وحجم الملفّ يُقرأ وقت البناء.
export const dynamic = "force-static";

const APK_PATH = "/download/club-jil-saad.apk";

/** حجم الملفّ بالميغابايت، أو null إن لم يُبنَ بعد. */
function apkSizeMb(): string | null {
  try {
    const { size } = statSync(join(process.cwd(), "public", APK_PATH));
    return (size / 1024 / 1024).toFixed(1);
  } catch {
    // الصفحة تسبق أوّل بناء للتطبيق عمدًا — فتعرض «قيد التجهيز» بدل زرٍّ مكسور.
    return null;
  }
}

export default function AppPage() {
  const a = strings.app;
  const sizeMb = apkSizeMb();

  return (
    <div className="relative min-h-svh overflow-hidden bg-ink px-5 py-14 text-parchment">
      <div className="absolute inset-0 text-gold">
        <GeoPattern opacity={0.05} />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,var(--color-ink)_75%)]" />

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center">
        <Link href="/" className="flex flex-col items-center gap-3">
          <Image
            src="/assets/logo-mark.svg"
            alt={strings.logoAlt}
            width={54}
            height={64}
            unoptimized
            className="h-12 w-auto"
          />
        </Link>
        <h1 className="mt-5 text-center font-logo text-3xl leading-[1.7] text-gold-light sm:text-4xl">
          {a.title}
        </h1>
        <p className="mt-2 max-w-md text-center text-sm leading-8 text-parchment/70">{a.subtitle}</p>

        {/* ── أندرويد ── */}
        <section className="mt-12 w-full rounded-2xl border border-gold/25 bg-ink-soft/60 p-6 backdrop-blur-sm sm:p-8">
          <h2 className="font-display text-xl text-gold">{a.androidHeading}</h2>

          {sizeMb ? (
            <>
              <a
                href={APK_PATH}
                download
                className="mt-5 block rounded-sm bg-gold px-6 py-4 text-center text-lg font-bold text-ink transition-opacity hover:opacity-90"
              >
                {a.download}
              </a>
              <p className="mt-2 text-center text-xs tracking-widest text-parchment/50">
                {a.downloadMeta.replace("{size}", sizeMb)}
              </p>
            </>
          ) : (
            <p className="mt-5 rounded-sm border border-dashed border-gold/30 px-6 py-4 text-center text-sm text-parchment/60">
              {a.soon}
            </p>
          )}

          <ol className="mt-8 space-y-6">
            {[
              [a.step1Title, a.step1Body],
              [a.step2Title, a.step2Body],
              [a.step3Title, a.step3Body],
              [a.step4Title, a.step4Body],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                {/* الترقيم هنا يحمل معنى: الترتيب ملزم، لا يُثبَّت ملفٌّ قبل تنزيله */}
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-gold/40 text-sm text-gold-light"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-base text-parchment">{title}</h3>
                  <p className="mt-1 text-sm leading-7 text-parchment/65">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* ── الشاشتان ── */}
          <div className="mt-9 rounded-xl border border-ink-line bg-ink/60 p-5 sm:p-6">
            <h3 className="font-display text-base text-gold-light">{a.warnHeading}</h3>
            <p className="mt-2 text-sm leading-7 text-parchment/60">{a.warnLead}</p>

            {/* سامسونغ أوّلًا وبعرضٍ كامل: هي الوحيدة التي تُوقف الطريق تمامًا،
                والوحيدة التي تُعالَج قبل التثبيت لا أثناءه. */}
            <div className="mt-6">
              <PhoneDialog
                tag={a.warnSamsungTag}
                blocking
                text={a.warnSamsungTitle}
                confirm={a.warnSamsungOk}
                hint={a.warnSamsungHint}
              />
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <PhoneDialog
                tag={a.warn1Tag}
                text={a.warn1Title}
                cancel={a.warn1Cancel}
                confirm={a.warn1Ok}
                hint={a.warn1Hint}
              />
              <PhoneDialog
                tag={a.warn2Tag}
                text={a.warn2Title}
                cancel={a.warn2Cancel}
                confirm={a.warn2Ok}
                hint={a.warn2Hint}
              />
            </div>
          </div>
        </section>

        {/* ── آيفون ── */}
        <section className="mt-6 w-full rounded-2xl border border-ink-line bg-ink-soft/40 p-6 backdrop-blur-sm sm:p-8">
          <h2 className="font-display text-xl text-parchment">{a.iosHeading}</h2>
          <p className="mt-2 text-sm leading-7 text-parchment/65">{a.iosLead}</p>
          <ol className="mt-5 space-y-3">
            {[a.iosStep1, a.iosStep2, a.iosStep3].map((step, i) => (
              <li key={step} className="flex gap-3 text-sm leading-7 text-parchment/80">
                <span aria-hidden="true" className="text-gold/70">
                  {i + 1}.
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-5 border-s-2 border-gold/50 ps-4 text-sm leading-7 text-gold-light">
            {a.iosPushNote}
          </p>
        </section>

        <section className="mt-6 w-full px-1">
          <h2 className="font-display text-sm text-parchment/70">{a.footNoteHeading}</h2>
          <p className="mt-1.5 text-sm leading-7 text-parchment/50">{a.footNote}</p>
        </section>

        <Link
          href="/"
          className="mt-10 text-sm text-parchment/60 transition-colors hover:text-gold"
        >
          {a.backHome}
        </Link>
      </main>
    </div>
  );
}

/**
 * محاكاة حوار نظام أندرويد. رقٌّ فاتح على صفحةٍ حبرية — الغرض أن يُقرأ
 * كجسمٍ غريب عن الصفحة، لأنّه كذلك فعلًا: هذه واجهة الهاتف لا واجهة النادي.
 *
 * `cancel` اختياريّ لأنّ حوار سامسونغ يحمل زرًّا واحدًا فقط، وهذا **هو
 * الفرق الذي يجب أن يُرى**: لا خيار فيه إلّا الخروج.
 */
function PhoneDialog({
  tag,
  text,
  cancel,
  confirm,
  hint,
  blocking = false,
}: {
  tag: string;
  text: string;
  cancel?: string;
  confirm: string;
  hint: string;
  /** حاجزٌ لا مخرج منه — يُعالَج قبل التثبيت، فيُميَّز بالبرتقالي. */
  blocking?: boolean;
}) {
  return (
    <figure className="m-0">
      <span
        className={`inline-block rounded-sm px-2 py-0.5 text-[11px] tracking-wide ${
          blocking ? "bg-tick-absent/20 text-tick-absent" : "bg-gold/10 text-gold/80"
        }`}
      >
        {tag}
      </span>
      <div className="mt-2 rounded-lg bg-parchment p-4 text-ink shadow-xl shadow-black/40">
        <p className="text-[13px] leading-6">{text}</p>
        <div className="mt-4 flex justify-end gap-5 text-[13px] font-bold">
          {/* ‎/40 قياسًا كان 2.56:1 على الرقّ — تحت الحدّ المقروء. ‎/60 يعطي
              4.73:1 ويبقى باهتًا بجانب زرّ الإجراء، وهو المطلوب. */}
          {cancel && <span className="text-ink/60">{cancel}</span>}
          <span className="text-navy">{confirm}</span>
        </div>
      </div>
      <figcaption className="mt-2.5 text-xs leading-6 text-gold-light">{hint}</figcaption>
    </figure>
  );
}
