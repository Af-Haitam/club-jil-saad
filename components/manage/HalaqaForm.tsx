"use client";

import { useActionState } from "react";
import { createHalaqa } from "@/app/manage/actions";
import Field from "@/components/auth/Field";
import SelectField from "@/components/auth/SelectField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { strings } from "@/lib/strings";
import type { ActionState } from "@/lib/validation/auth";

type Opt = { id: string; full_name: string };
const initialState: ActionState = {};

export default function HalaqaForm({ supervisors }: { supervisors: Opt[] }) {
  const [state, action] = useActionState(createHalaqa, initialState);
  const m = strings.manage;

  return (
    <div className="max-w-xl rounded-xl border border-ink-line bg-ink-soft/40 p-6">
      <form action={action} className="flex flex-col gap-5">
        <FormError message={state.error} />
        {state.notice && (
          <p role="status" className="rounded-md border border-tick-green/40 bg-tick-green/10 p-3 text-sm text-tick-green">
            {state.notice}
          </p>
        )}

        <Field id="name" name="name" label={m.halaqaName} required error={state.fieldErrors?.name} />

        <SelectField id="supervisor_id" name="supervisor_id" label={m.halaqaSupervisor} defaultValue="">
          <option value="">{m.chooseSupervisor}</option>
          {supervisors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </SelectField>

        <Field id="schedule_note" name="schedule_note" label={m.halaqaScheduleNote} error={state.fieldErrors?.schedule_note} />
        <Field id="capacity" name="capacity" type="number" inputMode="numeric" label={m.halaqaCapacity} error={state.fieldErrors?.capacity} />

        <SubmitButton idleLabel={m.halaqaCreate} pendingLabel={m.halaqaCreating} className="w-full sm:w-auto" />
      </form>
    </div>
  );
}
