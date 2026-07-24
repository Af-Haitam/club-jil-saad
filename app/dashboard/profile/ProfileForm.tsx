"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateProfile } from "./actions";
import Field from "@/components/auth/Field";
import SelectField from "@/components/auth/SelectField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { strings } from "@/lib/strings";
import type { ActionState } from "@/lib/validation/auth";

type ProfileFields = {
  full_name: string;
  phone: string | null;
  email: string | null;
  session_day: number | null;
  weekly_amount: number | null;
};

const initialState: ActionState = {};

export default function ProfileForm({ profile }: { profile: ProfileFields }) {
  const [state, formAction] = useActionState(updateProfile, initialState);
  const d = strings.dashboard;
  const a = strings.auth;

  return (
    <section className="max-w-lg rounded-xl border border-ink-line bg-ink-soft/40 p-6">
      <h1 className="mb-1 font-bold text-xl text-gold-light">{d.profileTitle}</h1>
      <p className="mb-5 text-sm text-parchment/60">{d.profileSubtitle}</p>

      <form action={formAction} className="flex flex-col gap-5">
        <FormError message={state.error} />
        {state.notice && (
          <p
            role="status"
            className="rounded-md border border-tick-green/40 bg-tick-green/10 p-3 text-sm text-tick-green"
          >
            {state.notice}
          </p>
        )}

        <Field
          id="full_name"
          name="full_name"
          label={a.fullNameLabel}
          defaultValue={profile.full_name}
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
          defaultValue={profile.phone ?? ""}
          error={state.fieldErrors?.phone}
        />

        <div className="text-sm">
          <span className="text-parchment/55">{a.emailLabel}: </span>
          <span dir="ltr" className="text-parchment/80">
            {profile.email}
          </span>
        </div>

        <SelectField
          id="session_day"
          name="session_day"
          label={a.sessionDayLabel}
          defaultValue={profile.session_day ?? ""}
          required
          error={state.fieldErrors?.session_day}
        >
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
          defaultValue={profile.weekly_amount ?? ""}
          required
          error={state.fieldErrors?.weekly_amount}
        >
          {strings.hifzAmounts.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>

        <div className="flex items-center gap-4">
          <SubmitButton idleLabel={d.profileSave} pendingLabel={d.profileSaving} />
          <Link href="/dashboard" className="text-sm text-parchment/60 transition-colors hover:text-gold">
            {d.backToDashboard}
          </Link>
        </div>
      </form>
    </section>
  );
}
