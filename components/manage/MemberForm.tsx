"use client";

// لوحة تعديل عضو واحد — تُفتح داخل صفّه في قائمة الأعضاء.
// كل شيء في حفظة واحدة: الدور، الحالة، العضوية، الحلقة، وقت الحصة، والتقدم.
import { useActionState } from "react";
import { updateMember } from "@/app/manage/actions";
import Field from "@/components/auth/Field";
import SelectField from "@/components/auth/SelectField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { strings } from "@/lib/strings";
import { surahs } from "@/lib/quran/surahs";
import type { ActionState } from "@/lib/validation/auth";
import type { Profile, HifzProgress } from "@/lib/types/database";

const initialState: ActionState = {};
const m = strings.manage;

type Props = {
  member: Profile;
  progress: HifzProgress | null;
  halaqat: { id: string; name: string }[];
  halaqaId: string;
  isSelf: boolean;
};

export default function MemberForm(props: Props) {
  const [state, action] = useActionState(updateMember, initialState);
  const { member, halaqaId, progress } = props;

  // React يطبّق defaultValue عند التركيب فقط، فبعد الحفظ ترتدّ القوائم إلى قيمتها
  // القديمة بينما يعرض الصفّ فوقها القيمة الجديدة. تغيّر هذا المفتاح يعيد تركيب
  // الحقول بالقيم المحفوظة فعلًا، ورسالة النجاح باقية لأنها خارج الكتلة.
  const stamp = `${member.updated_at}|${halaqaId}|${progress?.updated_at ?? ""}`;

  return (
    <form action={action} className="flex flex-col gap-5 border-t border-ink-line bg-ink/40 p-5">
      <input type="hidden" name="id" value={member.id} />
      <FormError message={state.error} />
      {state.notice && (
        <p role="status" className="rounded-md border border-tick-green/40 bg-tick-green/10 p-3 text-sm text-tick-green">
          {state.notice}
        </p>
      )}

      <MemberFields key={stamp} {...props} fieldErrors={state.fieldErrors} />

      <SubmitButton idleLabel={m.saveMember} pendingLabel={m.savingMember} className="w-full sm:w-auto sm:self-start" />
    </form>
  );
}

function MemberFields({
  member,
  progress,
  halaqat,
  halaqaId,
  isSelf,
  fieldErrors,
}: Props & { fieldErrors?: Record<string, string> }) {
  return (
    <div className="flex flex-col gap-5">
      {/* الدور والحالة — مجمّدان على النفس، فتغييرهما يعني قفل الإدارة على نفسك. */}
      {isSelf ? (
        <>
          <input type="hidden" name="role" value={member.role} />
          <input type="hidden" name="status" value={member.status} />
          <p className="rounded-md border border-gold/25 bg-gold/[0.06] p-3 text-sm text-parchment/70">{m.errSelfRole}</p>
        </>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField id={`role-${member.id}`} name="role" label={m.fRole} defaultValue={member.role} error={fieldErrors?.role}>
            <option value="member">{m.roleMember}</option>
            <option value="supervisor">{m.roleSupervisor}</option>
            <option value="admin">{m.roleAdmin}</option>
          </SelectField>
          <SelectField id={`status-${member.id}`} name="status" label={m.fStatus} defaultValue={member.status} error={fieldErrors?.status}>
            <option value="active">{m.stActive}</option>
            <option value="pending">{m.stPending}</option>
            <option value="suspended">{m.stSuspended}</option>
          </SelectField>
        </div>
      )}

      <fieldset className="flex flex-wrap gap-x-8 gap-y-3">
        <Check id={`hifz-${member.id}`} name="in_hifz" label={m.fInHifz} defaultChecked={member.in_hifz} />
        <Check id={`club-${member.id}`} name="in_club" label={m.fInClub} defaultChecked={member.in_club} />
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField id={`halaqa-${member.id}`} name="halaqa_id" label={m.colHalaqa} defaultValue={halaqaId}>
          <option value="">{m.noHalaqa}</option>
          {halaqat.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          id={`day-${member.id}`}
          name="session_day"
          label={m.fDay}
          defaultValue={member.session_day === null ? "" : String(member.session_day)}
          error={fieldErrors?.session_day}
        >
          <option value="">{m.chooseDay}</option>
          {strings.weekdays.map((d, i) => (
            <option key={d} value={i}>
              {d}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`time-${member.id}`}
          name="session_time"
          type="time"
          label={m.fTime}
          defaultValue={member.session_time?.slice(0, 5) ?? ""}
          error={fieldErrors?.session_time}
        />
        <SelectField
          id={`amount-${member.id}`}
          name="weekly_amount"
          label={m.fAmount}
          defaultValue={member.weekly_amount === null ? "" : String(member.weekly_amount)}
          error={fieldErrors?.weekly_amount}
        >
          <option value="">{m.chooseAmount}</option>
          {strings.hifzAmounts.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="border-t border-ink-line pt-5">
        <h4 className="mb-4 font-bold text-sm text-gold-light">{m.progressTitle}</h4>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id={`surah-${member.id}`}
            name="current_surah"
            label={m.pSurah}
            defaultValue={progress?.current_surah == null ? "" : String(progress.current_surah)}
            error={fieldErrors?.current_surah}
          >
            <option value="">{m.dash}</option>
            {surahs.map((s) => (
              <option key={s.number} value={s.number}>
                {s.name_ar}
              </option>
            ))}
          </SelectField>
          <Field
            id={`ayah-${member.id}`}
            name="current_ayah"
            type="number"
            inputMode="numeric"
            label={m.pAyah}
            defaultValue={progress?.current_ayah ?? ""}
            error={fieldErrors?.current_ayah}
          />
          <Field
            id={`pages-${member.id}`}
            name="memorized_pages"
            type="number"
            inputMode="numeric"
            label={m.pPages}
            defaultValue={progress?.memorized_pages ?? ""}
            error={fieldErrors?.memorized_pages}
          />
          <Field
            id={`juz-${member.id}`}
            name="memorized_juz"
            type="number"
            step="0.25"
            inputMode="decimal"
            label={m.pJuz}
            defaultValue={progress?.memorized_juz ?? ""}
            error={fieldErrors?.memorized_juz}
          />
        </div>
      </div>
    </div>
  );
}

// خانة اختيار مُسمّاة — غيابها من FormData يعني false، وهذا ما يتوقّعه المخطّط.
function Check({
  id,
  name,
  label,
  defaultChecked,
}: {
  id: string;
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 text-sm text-parchment/85">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="size-4 accent-gold outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      />
      {label}
    </label>
  );
}
