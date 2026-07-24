"use client";

// زر إرسال يعرف حالة الانتظار عبر useFormStatus — يعمل داخل أي <form action=.../>.
import { useFormStatus } from "react-dom";

export default function SubmitButton({
  idleLabel,
  pendingLabel,
  className,
}: {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`rounded-sm bg-gold px-6 py-2.5 font-medium text-ink transition-colors duration-200 hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
