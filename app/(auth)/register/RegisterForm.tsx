"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { strings } from "@/lib/strings";
import Field from "@/components/auth/Field";
import SelectField from "@/components/auth/SelectField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { registerAction } from "./actions";
import type { ActionState } from "@/lib/validation/auth";

const initialState: ActionState = {};

type Path = "club" | "hifz";

export default function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);
  const [path, setPath] = useState<Path>("hifz");
  const a = strings.auth;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div>
        <h1 className="font-body font-bold text-2xl text-gold-light">{a.registerTitle}</h1>
        <p className="mt-1 text-sm text-parchment/65">{a.registerSubtitle}</p>
      </div>

      <FormError message={state.error ?? state.fieldErrors?.path} />

      {state.notice && (
        <p
          role="status"
          className="rounded-md border border-gold/40 bg-gold/10 p-3 text-sm text-gold-light"
        >
          {state.notice}
        </p>
      )}

      {/* اختيار المسار — بطاقتان بدلالة radiogroup، ذهبي عند الاختيار.
          الحفظ أولًا (يمين في RTL) ثم النادي (يسار) */}
      <div className="flex flex-col gap-2">
        <p id="path-label" className="text-sm text-parchment/85">
          {a.pathQuestion}
        </p>
        <div
          role="radiogroup"
          aria-labelledby="path-label"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <PathCard
            selected={path === "hifz"}
            title={a.pathHifzTitle}
            hint={a.pathHifzHint}
            onSelect={() => setPath("hifz")}
          />
          <PathCard
            selected={path === "club"}
            title={a.pathClubTitle}
            hint={a.pathClubHint}
            onSelect={() => setPath("club")}
          />
        </div>
        <input type="hidden" name="path" value={path} />
      </div>

      <Field
        id="full_name"
        name="full_name"
        label={a.fullNameLabel}
        placeholder={a.fullNamePlaceholder}
        autoComplete="name"
        required
        error={state.fieldErrors?.full_name}
      />

      <Field
        id="phone"
        name="phone"
        type="tel"
        dir="ltr"
        label={a.phoneLabel}
        placeholder={a.phonePlaceholder}
        autoComplete="tel"
        required
        error={state.fieldErrors?.phone}
      />

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

      <SelectField
        id="session_day"
        name="session_day"
        label={a.sessionDayLabel}
        hint={a.sessionDayHint}
        required
        defaultValue=""
        error={state.fieldErrors?.session_day}
      >
        <option value="" disabled>
          {a.choosePlaceholder}
        </option>
        {strings.weekdays.map((day, i) => (
          <option key={i} value={i}>
            {day}
          </option>
        ))}
      </SelectField>

      <SelectField
        id="weekly_amount"
        name="weekly_amount"
        label={a.weeklyAmountLabel}
        required
        defaultValue=""
        error={state.fieldErrors?.weekly_amount}
      >
        <option value="" disabled>
          {a.choosePlaceholder}
        </option>
        {strings.hifzAmounts.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>

      <SubmitButton idleLabel={a.registerSubmit} pendingLabel={a.registerSubmitting} className="mt-2 w-full" />

      <p className="text-center text-sm text-parchment/65">
        {a.haveAccount}{" "}
        <Link href="/login" className="text-gold underline underline-offset-4 hover:text-gold-light">
          {a.goLogin}
        </Link>
      </p>
    </form>
  );
}

function PathCard({
  selected,
  title,
  hint,
  onSelect,
}: {
  selected: boolean;
  title: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`rounded-md border p-4 text-start transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
        selected ? "border-gold bg-gold/10" : "border-ink-line bg-ink hover:border-gold/40"
      }`}
    >
      <span className={`block font-body font-bold text-base ${selected ? "text-gold-light" : "text-parchment"}`}>
        {title}
      </span>
      <span className="mt-1 block text-sm text-parchment/60">{hint}</span>
    </button>
  );
}
