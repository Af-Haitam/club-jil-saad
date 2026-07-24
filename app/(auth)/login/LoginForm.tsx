"use client";

import { useActionState } from "react";
import Link from "next/link";
import { strings } from "@/lib/strings";
import Field from "@/components/auth/Field";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { loginAction } from "./actions";
import type { ActionState } from "@/lib/validation/auth";

export default function LoginForm({ initialError }: { initialError?: string }) {
  const a = strings.auth;
  const initialState: ActionState = initialError ? { error: initialError } : {};
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div>
        <h1 className="font-body font-bold text-2xl text-gold-light">{a.loginTitle}</h1>
        <p className="mt-1 text-sm text-parchment/65">{a.loginSubtitle}</p>
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

      <Field
        id="password"
        name="password"
        type="password"
        dir="ltr"
        label={a.passwordLabel}
        placeholder={a.passwordPlaceholder}
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />

      <div className="-mt-2 text-end text-sm">
        <Link href="/forgot-password" className="text-parchment/60 transition-colors hover:text-gold">
          {a.forgotLink}
        </Link>
      </div>

      <SubmitButton idleLabel={a.loginSubmit} pendingLabel={a.loginSubmitting} className="w-full" />

      <p className="text-center text-sm text-parchment/65">
        {a.noAccount}{" "}
        <Link href="/register" className="text-gold underline underline-offset-4 hover:text-gold-light">
          {a.goRegister}
        </Link>
      </p>
    </form>
  );
}
