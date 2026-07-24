"use client";

import { useActionState } from "react";
import { recordAction } from "@/app/manage/actions";
import Field from "@/components/auth/Field";
import SelectField from "@/components/auth/SelectField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { strings } from "@/lib/strings";
import { surahs } from "@/lib/quran/surahs";
import type { ActionState } from "@/lib/validation/auth";

type MemberOpt = { id: string; full_name: string };
const initialState: ActionState = {};

export default function RecordForm({ members, weekCount }: { members: MemberOpt[]; weekCount: number }) {
  const [state, action] = useActionState(recordAction, initialState);
  const m = strings.manage;
  const d = strings.dashboard;

  const statuses = [
    { v: "green", l: d.stGreen },
    { v: "red", l: d.stRed },
    { v: "absent", l: d.stAbsent },
    { v: "excused", l: d.stExcused },
  ];

  return (
    <div className="max-w-2xl rounded-xl border border-ink-line bg-ink-soft/40 p-6">
      <form action={action} className="flex flex-col gap-5">
        <FormError message={state.error} />
        {state.notice && (
          <p role="status" className="rounded-md border border-tick-green/40 bg-tick-green/10 p-3 text-sm text-tick-green">
            {state.notice}
          </p>
        )}

        <SelectField id="member_id" name="member_id" label={m.recordMember} defaultValue="" required error={state.fieldErrors?.member_id}>
          <option value="" disabled>
            {m.chooseMember}
          </option>
          {members.map((x) => (
            <option key={x.id} value={x.id}>
              {x.full_name}
            </option>
          ))}
        </SelectField>

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField id="week_number" name="week_number" label={m.recordWeek} defaultValue="1" required error={state.fieldErrors?.week_number}>
            {Array.from({ length: weekCount }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                {d.weekWord} {w}
              </option>
            ))}
          </SelectField>
          <SelectField id="status" name="status" label={m.recordStatus} defaultValue="green" required error={state.fieldErrors?.status}>
            {statuses.map((s) => (
              <option key={s.v} value={s.v}>
                {s.l}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField id="from_surah" name="from_surah" label={m.recordFromSurah} defaultValue="" error={state.fieldErrors?.from_surah}>
            <option value="">{m.dash}</option>
            {surahs.map((s) => (
              <option key={s.number} value={s.number}>
                {s.name_ar}
              </option>
            ))}
          </SelectField>
          <Field id="from_ayah" name="from_ayah" type="number" inputMode="numeric" label={m.recordFromAyah} error={state.fieldErrors?.from_ayah} />
          <SelectField id="to_surah" name="to_surah" label={m.recordToSurah} defaultValue="" error={state.fieldErrors?.to_surah}>
            <option value="">{m.dash}</option>
            {surahs.map((s) => (
              <option key={s.number} value={s.number}>
                {s.name_ar}
              </option>
            ))}
          </SelectField>
          <Field id="to_ayah" name="to_ayah" type="number" inputMode="numeric" label={m.recordToAyah} error={state.fieldErrors?.to_ayah} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="hizb_number" name="hizb_number" type="number" inputMode="numeric" label={m.recordHizb} error={state.fieldErrors?.hizb_number} />
          <Field id="mistakes_count" name="mistakes_count" type="number" inputMode="numeric" label={m.recordMistakes} error={state.fieldErrors?.mistakes_count} />
        </div>

        <Field id="notes" name="notes" label={m.recordNotes} error={state.fieldErrors?.notes} />

        <SubmitButton idleLabel={m.recordSave} pendingLabel={m.recordSaving} className="w-full sm:w-auto" />
      </form>
    </div>
  );
}
