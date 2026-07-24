"use client";

import { useActionState, useState } from "react";
import { publishContent } from "@/app/manage/actions";
import { uploadImage, MAX_UPLOAD_BYTES } from "@/lib/manage/upload";
import Field from "@/components/auth/Field";
import SelectField from "@/components/auth/SelectField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { strings } from "@/lib/strings";
import type { ActionState } from "@/lib/validation/auth";

type Kind = "ad" | "reminder";
const initialState: ActionState = {};

export default function ContentForm() {
  const [state, action] = useActionState(publishContent, initialState);
  const [kind, setKind] = useState<Kind>("ad");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const m = strings.manage;

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(m.imageTooBig);
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      setImageUrl(await uploadImage(file));
    } catch {
      setUploadError(strings.auth.errGeneric);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-xl rounded-xl border border-ink-line bg-ink-soft/40 p-6">
      {/* تبويب: إعلان / تذكير */}
      <div className="mb-5 inline-flex rounded-lg border border-ink-line p-1">
        {(["ad", "reminder"] as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
              kind === k ? "bg-gold text-ink" : "text-parchment/70 hover:text-gold"
            }`}
          >
            {k === "ad" ? m.tabAds : m.tabReminders}
          </button>
        ))}
      </div>

      <form action={action} className="flex flex-col gap-5">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="image_url" value={imageUrl} />

        <FormError message={state.error} />
        {state.notice && (
          <p role="status" className="rounded-md border border-tick-green/40 bg-tick-green/10 p-3 text-sm text-tick-green">
            {state.notice}
          </p>
        )}

        <Field id="title" name="title" label={m.cTitle} required error={state.fieldErrors?.title} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="body" className="text-sm text-parchment/85">
            {m.cBody}
          </label>
          <textarea
            id="body"
            name="body"
            rows={4}
            className="w-full resize-y rounded-sm border border-ink-line bg-ink px-3.5 py-2.5 text-parchment outline-none transition-colors focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/60"
          />
        </div>

        <SelectField id="audience_type" name="audience_type" label={m.cAudience} defaultValue="both" required>
          <option value="both">{m.audBoth}</option>
          <option value="hifz">{m.audHifz}</option>
          <option value="club">{m.audClub}</option>
        </SelectField>

        {/* الصورة */}
        <div className="flex flex-col gap-2">
          <label htmlFor="image" className="text-sm text-parchment/85">
            {m.cImage}
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={onPickImage}
            className="text-sm text-parchment/70 file:me-3 file:rounded-sm file:border-0 file:bg-ink-line file:px-3 file:py-1.5 file:text-parchment hover:file:bg-gold hover:file:text-ink"
          />
          {uploading && <p className="text-xs text-parchment/60">{m.uploading}</p>}
          {uploadError && <p className="text-xs text-tick-red">{uploadError}</p>}
          {imageUrl && (
            <div className="mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="max-h-40 rounded-md border border-ink-line" />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="mt-1 text-xs text-parchment/55 underline underline-offset-2 hover:text-gold"
              >
                {m.removeImage}
              </button>
            </div>
          )}
        </div>

        <SubmitButton idleLabel={m.cPublish} pendingLabel={m.cPublishing} className="w-full sm:w-auto" />
      </form>
    </div>
  );
}
