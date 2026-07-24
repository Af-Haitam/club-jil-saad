"use client";

import { useActionState } from "react";
import Link from "next/link";
import { strings } from "@/lib/strings";
import Field from "@/components/auth/Field";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { forgotAction } from "./actions";
import type { ActionState } from "@/lib/validation/auth";

const initialState: ActionState = {};

export default function ForgotForm() {
  const [state, formAction] = useActionState(forgotAction, initialState);
  const a = strings.auth;

  // بعد الإرسال — لا نكشف أبدًا ما إذا كان البريد مسجّلًا، نفس الرسالة دومًا.
  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <h1 className="font-body font-bold text-2xl text-gold-light">{a.forgotTitle}</h1>
        <p className="leading-8 text-parchment/80">{a.forgotSent}</p>
        <Link href="/login" className="text-sm text-gold underline underline-offset-4 hover:text-gold-light">
          {a.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div>
        <h1 className="font-body font-bold text-2xl text-gold-light">{a.forgotTitle}</h1>
        <p className="mt-1 text-sm text-parchment/65">{a.forgotSubtitle}</p>
      </div>

      <FormError message={state.error} />

      <Field
        id="email"
        name="email"
        type="email"
        dir="ltr"
        label={a.emailLabel}
        placeholder={a.emailPlaceholder}
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />

      <SubmitButton idleLabel={a.forgotSubmit} pendingLabel={a.forgotSubmitting} className="w-full" />

      <p className="text-center text-sm text-parchment/65">
        <Link href="/login" className="text-gold underline underline-offset-4 hover:text-gold-light">
          {a.backToLogin}
        </Link>
      </p>
    </form>
  );
}
