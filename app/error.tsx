"use client";

// حدُّ الخطأ.
//
// بدونه تُظهر Next صفحتها الافتراضية عند أيّ استثناءٍ في الخادم، وهي
// إنجليزية على موقعٍ عربيّ بالكامل — فيقرأ العضو «Application error» ويظنّ
// الموقع مكسورًا لا أنّ طلبًا واحدًا تعثّر.
//
// ووجودُه شرطٌ لأن تُظهر الاستعلامات أخطاءها بدل ابتلاعها: `lib/dashboard/
// queries.ts` صار يرمي حين يُرفض استعلام، وكان قبلها يُرجع شبكةً فارغة
// تُشبه «لا بيانات». الرمي بلا حدٍّ يُبدّل عطلًا صامتًا بعطلٍ قبيح.
import { useEffect } from "react";
import Link from "next/link";
import { strings } from "@/lib/strings";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // سجلّ الخادم في Vercel هو ما يُقرأ عند التحقيق، والبصمة تربط
    // ما رآه العضو بالسطر هناك.
    console.error("dashboard error:", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-ink px-6 py-16 text-center text-parchment">
      <h1 className="font-logo text-2xl leading-[1.8] text-gold-light">{strings.errorTitle}</h1>
      <p className="max-w-sm text-sm leading-8 text-parchment/70">{strings.errorBody}</p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-sm bg-gold px-6 py-2.5 text-sm font-bold text-ink transition-opacity hover:opacity-90"
        >
          {strings.errorRetry}
        </button>
        <Link
          href="/"
          className="rounded-sm border border-gold/45 px-6 py-2.5 text-sm text-gold transition-colors hover:bg-gold hover:text-ink"
        >
          {strings.errorHome}
        </Link>
      </div>

      {/* البصمة وحدها — لا نصّ الاستثناء: قد يحمل أسماء أعمدةٍ أو معرّفات */}
      {error.digest ? (
        <p className="mt-4 text-[11px] tracking-widest text-parchment/35">{error.digest}</p>
      ) : null}
    </div>
  );
}
