"use client";

// تعديل حلقة قائمة — نفس حقول الإنشاء، لكن على حلقة موجودة.
import { useActionState } from "react";
import { updateHalaqa } from "@/app/manage/actions";
import Field from "@/components/auth/Field";
import SelectField from "@/components/auth/SelectField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { strings } from "@/lib/strings";
import type { ActionState } from "@/lib/validation/auth";
import type { Halaqa } from "@/lib/types/database";

const initialState: ActionState = {};

export default function HalaqaEditForm({
  halaqa,
  supervisors,
}: {
  halaqa: Halaqa;
  supervisors: { id: string; full_name: string }[];
}) {
  const [state, action] = useActionState(updateHalaqa, initialState);
  const m = strings.manage;

  return (
    <form action={action} className="flex flex-col gap-5 border-t border-ink-line bg-ink/40 p-5">
      <input type="hidden" name="id" value={halaqa.id} />
      <FormError message={state.error} />
      {state.notice && (
        <p role="status" className="rounded-md border border-tick-green/40 bg-tick-green/10 p-3 text-sm text-tick-green">
          {state.notice}
        </p>
      )}

      {/* نفس سبب المفتاح في MemberForm: defaultValue لا يُطبَّق إلا عند التركيب. */}
      <div
        key={`${halaqa.name}|${halaqa.supervisor_id}|${halaqa.schedule_note}|${halaqa.capacity}`}
        className="grid gap-5 sm:grid-cols-2"
      >
        <Field
          id={`hname-${halaqa.id}`}
          name="name"
          label={m.halaqaName}
          defaultValue={halaqa.name}
          required
          error={state.fieldErrors?.name}
        />
        <SelectField
          id={`hsup-${halaqa.id}`}
          name="supervisor_id"
          label={m.halaqaSupervisor}
          defaultValue={halaqa.supervisor_id ?? ""}
        >
          <option value="">{m.chooseSupervisor}</option>
          {supervisors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </SelectField>
        <Field
          id={`hnote-${halaqa.id}`}
          name="schedule_note"
          label={m.halaqaScheduleNote}
          defaultValue={halaqa.schedule_note ?? ""}
          error={state.fieldErrors?.schedule_note}
        />
        <Field
          id={`hcap-${halaqa.id}`}
          name="capacity"
          type="number"
          inputMode="numeric"
          label={m.halaqaCapacity}
          defaultValue={halaqa.capacity ?? ""}
          error={state.fieldErrors?.capacity}
        />
      </div>

      <SubmitButton idleLabel={m.halaqaSave} pendingLabel={m.halaqaSaving} className="w-full sm:w-auto sm:self-start" />
    </form>
  );
}
