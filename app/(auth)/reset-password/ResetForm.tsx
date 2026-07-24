"use client";

import { useActionState } from "react";
import Link from "next/link";
import { strings } from "@/lib/strings";
import Field from "@/components/auth/Field";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { resetAction } from "./actions";
import type { ActionState } from "@/lib/validation/auth";

const initialState: ActionState = {};

export default function ResetForm() {
  const [state, formAction] = useActionState(resetAction, initialState);
  const a = strings.auth;

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <h1 className="font-body font-bold text-2xl text-gold-light">{a.resetTitle}</h1>
        <p className="leading-8 text-parchment/80">{a.resetDone}</p>
        <Link href="/login" className="text-sm text-gold underline underline-offset-4 hover:text-gold-light">
          {a.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div>
        <h1 className="font-body font-bold text-2xl text-gold-light">{a.resetTitle}</h1>
        <p className="mt-1 text-sm text-parchment/65">{a.resetSubtitle}</p>
      </div>

      <FormError message={state.error} />

      <Field
        id="password"
        name="password"
        type="password"
        dir="ltr"
        label={a.passwordLabel}
        placeholder={a.passwordPlaceholder}
        autoComplete="new-password"
        required
        minLength={8}
        error={state.fieldErrors?.password}
      />

      <Field
        id="confirm"
        name="confirm"
        type="password"
        dir="ltr"
        label={a.confirmLabel}
        placeholder={a.confirmPlaceholder}
        autoComplete="new-password"
        required
        minLength={8}
        error={state.fieldErrors?.confirm}
      />

      <SubmitButton idleLabel={a.resetSubmit} pendingLabel={a.resetSubmitting} className="w-full" />
    </form>
  );
}
