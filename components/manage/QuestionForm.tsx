"use client";

// طرح سؤال.
//
// الاختيار الصحيح يُعلَّم بزرِّ راديو لا بمربّع اختيار، وهذا قرارٌ لا شكل:
// السؤال ينتهي بنقطةٍ واحدة، وجوابان صحيحان يجعلان التصحيح بلا معنى.
// والراديو يقول ذلك بنفسه قبل أن يقرأ أحدٌ تعليمة.
import { useActionState, useState } from "react";
import { publishQuestion } from "@/app/manage/actions";
import Field from "@/components/auth/Field";
import SelectField from "@/components/auth/SelectField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { strings } from "@/lib/strings";
import type { ActionState } from "@/lib/validation/auth";

type Audience = "both" | "hifz" | "club" | "halaqa" | "member";

const initialState: ActionState = {};

/** أبجد هوّز — كما تُرقَّم الاختيارات في الكتب العربية، وكما يراها العضو. */
const ABJAD = ["أ", "ب", "ج", "د", "هـ", "و"];

export interface QuestionFormProps {
  isAdmin: boolean;
  halaqat: { id: string; name: string }[];
  members: { id: string; full_name: string }[];
}

export default function QuestionForm({ isAdmin, halaqat, members }: QuestionFormProps) {
  const [state, action] = useActionState(publishQuestion, initialState);
  const [audience, setAudience] = useState<Audience>(isAdmin ? "both" : "halaqa");
  const [count, setCount] = useState(4);
  const m = strings.manage;

  return (
    <div className="max-w-xl rounded-xl border border-ink-line bg-ink-soft/40 p-6">
      <p className="mb-5 text-sm leading-7 text-parchment/65">{m.questionsLead}</p>

      <form action={action} className="flex flex-col gap-5">
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
          id="title"
          name="title"
          label={m.questionText}
          placeholder={m.questionTextPh}
          required
          error={state.fieldErrors?.title}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="body" className="text-sm text-parchment/85">
            {m.questionBody}
          </label>
          <textarea
            id="body"
            name="body"
            rows={2}
            placeholder={m.questionBodyPh}
            className="w-full resize-y rounded-sm border border-ink-line bg-ink px-3.5 py-2.5 text-parchment outline-none transition-colors placeholder:text-parchment/35 focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/60"
          />
        </div>

        {/* ── الاختيارات ── */}
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1 text-sm text-parchment/85">{m.questionOptions}</legend>
          <p className="-mt-1 mb-1 text-xs text-parchment/50">{m.questionOptionsHint}</p>

          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <label
                className="flex shrink-0 cursor-pointer items-center gap-2"
                title={m.questionCorrect}
              >
                <input
                  type="radio"
                  name="correct"
                  value={i + 1}
                  defaultChecked={i === 0}
                  required
                  className="size-4 accent-tick-green"
                />
                <span className="w-4 text-sm text-gold/80">{ABJAD[i]}</span>
              </label>
              <input
                id={`option_${i + 1}`}
                name={`option_${i + 1}`}
                placeholder={`${m.questionOptionPh} ${ABJAD[i]}`}
                className="w-full rounded-sm border border-ink-line bg-ink px-3.5 py-2 text-parchment outline-none transition-colors placeholder:text-parchment/35 focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/60"
              />
            </div>
          ))}

          {/* الخانات غير المعروضة تُرسل فارغةً فيُسقطها الخادم — وهذا أسلم
              من حذفها، إذ يبقى ترقيم الحقول ثابتًا مهما تغيّر العدد. */}
          {Array.from({ length: 6 - count }, (_, i) => (
            <input key={`h${i}`} type="hidden" name={`option_${count + i + 1}`} value="" />
          ))}

          {(state.fieldErrors?.option_2 || state.fieldErrors?.correct) && (
            <p className="text-xs text-tick-red">
              {state.fieldErrors?.option_2 ?? state.fieldErrors?.correct}
            </p>
          )}

          {count < 6 && (
            <button
              type="button"
              onClick={() => setCount((c) => Math.min(6, c + 1))}
              className="self-start text-xs text-gold/80 underline underline-offset-4 hover:text-gold"
            >
              + {m.questionOptionPh}
            </button>
          )}
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="explanation" className="text-sm text-parchment/85">
            {m.questionExplanation}
          </label>
          <textarea
            id="explanation"
            name="explanation"
            rows={2}
            placeholder={m.questionExplanationPh}
            className="w-full resize-y rounded-sm border border-ink-line bg-ink px-3.5 py-2.5 text-parchment outline-none transition-colors placeholder:text-parchment/35 focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/60"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="points"
            name="points"
            type="number"
            label={m.questionPoints}
            defaultValue="1"
            required
            error={state.fieldErrors?.points}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="closes_at" className="text-sm text-parchment/85">
              {m.questionCloses}
            </label>
            <input
              id="closes_at"
              name="closes_at"
              type="datetime-local"
              className="w-full rounded-sm border border-ink-line bg-ink px-3.5 py-2.5 text-parchment outline-none transition-colors focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/60"
            />
            <p className="text-xs text-parchment/50">{m.questionClosesHint}</p>
          </div>
        </div>

        <SelectField
          id="audience_type"
          name="audience_type"
          label={m.cAudience}
          value={audience}
          onChange={(e) => setAudience(e.target.value as Audience)}
          required
        >
          {isAdmin && (
            <>
              <option value="both">{m.audBoth}</option>
              <option value="hifz">{m.audHifz}</option>
              <option value="club">{m.audClub}</option>
            </>
          )}
          <option value="halaqa">{m.audHalaqa}</option>
          <option value="member">{m.audMember}</option>
        </SelectField>

        {audience === "halaqa" && (
          <SelectField
            id="halaqa_id"
            name="halaqa_id"
            label={m.cHalaqa}
            defaultValue=""
            error={state.fieldErrors?.halaqa_id}
            required
          >
            <option value="">{strings.auth.choosePlaceholder}</option>
            {halaqat.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </SelectField>
        )}

        {audience === "member" && (
          <SelectField
            id="member_id"
            name="member_id"
            label={m.cMember}
            defaultValue=""
            error={state.fieldErrors?.member_id}
            required
          >
            <option value="">{strings.auth.choosePlaceholder}</option>
            {members.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </SelectField>
        )}

        <SubmitButton
          idleLabel={m.questionSubmit}
          pendingLabel={m.questionSubmitting}
          className="w-full sm:w-auto"
        />
      </form>
    </div>
  );
}
