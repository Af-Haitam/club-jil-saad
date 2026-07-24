"use client";

import { useActionState, useState } from "react";
import { createExam } from "@/app/manage/actions";
import Field from "@/components/auth/Field";
import SelectField from "@/components/auth/SelectField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { strings } from "@/lib/strings";
import { surahs } from "@/lib/quran/surahs";
import type { ActionState } from "@/lib/validation/auth";

type Opt = { id: string; name: string };
type Scope = "all" | "halaqa" | "member";
const initialState: ActionState = {};

export default function ExamForm({ members, halaqat }: { members: Opt[]; halaqat: Opt[] }) {
  const [state, action] = useActionState(createExam, initialState);
  const [scope, setScope] = useState<Scope>("all");
  const m = strings.manage;

  const selectClass =
    "w-full rounded-sm border border-ink-line bg-ink px-3.5 py-2.5 text-parchment outline-none transition-colors focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/60";

  return (
    <div className="max-w-xl rounded-xl border border-ink-line bg-ink-soft/40 p-6">
      <form action={action} className="flex flex-col gap-5">
        <input type="hidden" name="scope" value={scope} />
        <FormError message={state.error} />
        {state.notice && (
          <p role="status" className="rounded-md border border-tick-green/40 bg-tick-green/10 p-3 text-sm text-tick-green">
            {state.notice}
          </p>
        )}

        <Field id="title" name="title" label={m.examName} required error={state.fieldErrors?.title} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="scope_ui" className="text-sm text-parchment/85">
            {m.examScope}
          </label>
          <select id="scope_ui" value={scope} onChange={(e) => setScope(e.target.value as Scope)} className={selectClass}>
            <option value="all">{m.scopeAll}</option>
            <option value="halaqa">{m.scopeHalaqa}</option>
            <option value="member">{m.scopeMember}</option>
          </select>
        </div>

        {scope === "member" && (
          <SelectField id="member_id" name="member_id" label={m.scopeMember} defaultValue="" required>
            <option value="" disabled>
              {m.chooseMember}
            </option>
            {members.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </SelectField>
        )}
        {scope === "halaqa" && (
          <SelectField id="halaqa_id" name="halaqa_id" label={m.scopeHalaqa} defaultValue="" required>
            <option value="" disabled>
              {m.dash}
            </option>
            {halaqat.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </SelectField>
        )}

        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="exam_date" name="exam_date" type="date" dir="ltr" label={m.examDate} />
          <Field id="exam_time" name="exam_time" type="time" dir="ltr" label={m.examTime} />
          <Field id="location" name="location" label={m.examPlace} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField id="from_surah" name="from_surah" label={m.recordFromSurah} defaultValue="">
            <option value="">{m.dash}</option>
            {surahs.map((s) => (
              <option key={s.number} value={s.number}>
                {s.name_ar}
              </option>
            ))}
          </SelectField>
          <Field id="from_ayah" name="from_ayah" type="number" inputMode="numeric" label={m.recordFromAyah} />
          <SelectField id="to_surah" name="to_surah" label={m.recordToSurah} defaultValue="">
            <option value="">{m.dash}</option>
            {surahs.map((s) => (
              <option key={s.number} value={s.number}>
                {s.name_ar}
              </option>
            ))}
          </SelectField>
          <Field id="to_ayah" name="to_ayah" type="number" inputMode="numeric" label={m.recordToAyah} />
        </div>

        <SubmitButton idleLabel={m.examCreate} pendingLabel={m.examCreating} className="w-full sm:w-auto" />
      </form>
    </div>
  );
}
