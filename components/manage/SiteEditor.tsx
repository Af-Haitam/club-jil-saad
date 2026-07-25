"use client";

// محرّر الصفحة الرئيسية — قائمة الأقسام التسعة، ولكل قسم لوحة تعديل.
//
// النموذج واحد لكل الأنواع: يقرأ شكل المحتوى نفسه ويرسم الحقل المناسب، فلا
// نكتب تسعة نماذج ولا نُضطر لتعديل الشيفرة حين يتغيّر محتوى قسم. ما لا يعرف
// رسمه (مصفوفات متداخلة كصفوف جدول التتبّع) يُعرض كحقل مقفل — ويبقى محفوظًا،
// لأنّ الحفظ يرسل كائن المحتوى كاملًا لا الحقول المرسومة فقط.
import { useActionState, useState, useTransition } from "react";
import Image from "next/image";
import { saveSection, seedSections, toggleSection, moveSection } from "@/app/manage/actions";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import { uploadImage, MAX_UPLOAD_BYTES } from "@/lib/manage/upload";
import { strings } from "@/lib/strings";
import type { ActionState } from "@/lib/validation/auth";
import type { SiteSectionRow } from "@/lib/site/queries";

const m = strings.manage;
const initialState: ActionState = {};

const label = (k: string) => strings.fieldLabels[k] ?? k;
const isImageKey = (k: string) => k === "logo" || /image|photo|صورة/i.test(k);
const isLongText = (v: string) => v.length > 70;

type Json = Record<string, unknown>;

export default function SiteEditor({ sections, seeded }: { sections: SiteSectionRow[]; seeded: boolean }) {
  const [seedState, seedAction] = useActionState(seedSections, initialState);

  if (!seeded) {
    return (
      <div className="rounded-xl border border-gold/30 bg-gold/[0.05] p-6">
        <p className="mb-4 text-parchment/80">{m.siteNotSeeded}</p>
        <FormError message={seedState.error} />
        <form action={seedAction}>
          <SubmitButton idleLabel={m.siteSeed} pendingLabel={m.siteSeeding} />
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="self-start text-sm text-gold/80 transition-colors hover:text-gold"
      >
        {m.siteOpenHome} ↗
      </a>
      {sections.map((s, i) => (
        <SectionCard key={s.id ?? s.type} section={s} isFirst={i === 0} isLast={i === sections.length - 1} />
      ))}
    </div>
  );
}

function SectionCard({
  section,
  isFirst,
  isLast,
}: {
  section: SiteSectionRow;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [state, action] = useActionState(saveSection, initialState);
  const [content, setContent] = useState<Json>(section.content);
  const [, startTransition] = useTransition();

  const name = strings.sectionTypes[section.type] ?? section.type;
  const id = section.id ?? "";

  const patch = (k: string, v: unknown) => setContent((c) => ({ ...c, [k]: v }));

  return (
    <div className="overflow-hidden rounded-lg border border-ink-line bg-ink-soft/40">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-parchment">{name}</span>
          {!section.is_visible && (
            <span className="rounded-sm border border-ink-line px-2 py-0.5 text-xs text-parchment/50">
              {m.siteHidden}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn
            label={m.siteUp}
            disabled={isFirst}
            onClick={() => startTransition(() => void moveSection(id, "up"))}
          >
            ↑
          </IconBtn>
          <IconBtn
            label={m.siteDown}
            disabled={isLast}
            onClick={() => startTransition(() => void moveSection(id, "down"))}
          >
            ↓
          </IconBtn>
          <button
            type="button"
            onClick={() => startTransition(() => void toggleSection(id, !section.is_visible))}
            className="rounded-sm border border-ink-line px-3 py-1 text-xs text-parchment/70 transition-colors hover:border-gold/60 hover:text-gold"
          >
            {section.is_visible ? m.siteHide : m.siteShow}
          </button>
        </div>
      </div>

      <details className="border-t border-ink-line">
        <summary className="cursor-pointer list-none px-4 py-2 text-xs text-gold/75 transition-colors hover:text-gold [&::-webkit-details-marker]:hidden">
          {m.siteEdit}
        </summary>
        <form action={action} className="flex flex-col gap-5 border-t border-ink-line bg-ink/40 p-5">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="content" value={JSON.stringify(content)} />
          <FormError message={state.error} />
          {state.notice && (
            <p role="status" className="rounded-md border border-tick-green/40 bg-tick-green/10 p-3 text-sm text-tick-green">
              {state.notice}
            </p>
          )}

          {Object.entries(content).map(([k, v]) => (
            <Field key={k} name={k} value={v} onChange={(nv) => patch(k, nv)} />
          ))}

          <SubmitButton idleLabel={m.siteSave} pendingLabel={m.siteSaving} className="w-full sm:w-auto sm:self-start" />
        </form>
      </details>
    </div>
  );
}

function IconBtn({
  label: aria,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={aria}
      title={aria}
      disabled={disabled}
      onClick={onClick}
      className="size-7 rounded-sm border border-ink-line text-parchment/70 transition-colors hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** يختار شكل الحقل من شكل القيمة نفسها. */
function Field({ name, value, onChange }: { name: string; value: unknown; onChange: (v: unknown) => void }) {
  if (typeof value === "string") {
    return isImageKey(name) ? (
      <ImageField name={name} value={value} onChange={onChange} />
    ) : (
      <TextField name={name} value={value} onChange={onChange} />
    );
  }

  if (typeof value === "number") {
    return (
      <Labelled name={name}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-32 rounded-sm border border-ink-line bg-ink px-3 py-2 text-parchment outline-none focus-visible:border-gold"
        />
      </Labelled>
    );
  }

  // قائمة نصوص: فقرات، مثلًا
  if (Array.isArray(value) && value.every((x) => typeof x === "string")) {
    const list = value as string[];
    return (
      <Labelled name={name}>
        <div className="flex flex-col gap-2">
          {list.map((item, i) => (
            <div key={i} className="flex gap-2">
              <textarea
                value={item}
                rows={2}
                onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))}
                className="w-full rounded-sm border border-ink-line bg-ink px-3 py-2 text-parchment outline-none focus-visible:border-gold"
              />
              <RemoveBtn onClick={() => onChange(list.filter((_, j) => j !== i))} />
            </div>
          ))}
          <AddBtn onClick={() => onChange([...list, ""])} />
        </div>
      </Labelled>
    );
  }

  // قائمة كائنات بسيطة: الركائز، الخطوات، الأنشطة…
  if (Array.isArray(value) && value.every((x) => isFlatObject(x))) {
    const list = value as Json[];
    const shape = list[0] ?? {};
    return (
      <Labelled name={name}>
        <div className="flex flex-col gap-3">
          {list.map((item, i) => (
            <div key={i} className="rounded-md border border-ink-line/70 p-3">
              <div className="mb-2 flex justify-end">
                <RemoveBtn onClick={() => onChange(list.filter((_, j) => j !== i))} />
              </div>
              <div className="flex flex-col gap-3">
                {Object.entries(item).map(([k, v]) =>
                  typeof v === "string" ? (
                    <TextField
                      key={k}
                      name={k}
                      value={v}
                      onChange={(nv) => onChange(list.map((x, j) => (j === i ? { ...x, [k]: nv } : x)))}
                    />
                  ) : (
                    <Locked key={k} name={k} />
                  )
                )}
              </div>
            </div>
          ))}
          <AddBtn
            onClick={() => onChange([...list, Object.fromEntries(Object.keys(shape).map((k) => [k, ""]))])}
          />
        </div>
      </Labelled>
    );
  }

  // كائن بسيط: بيانات التواصل، أزرار الدعوة…
  if (isFlatObject(value)) {
    const obj = value as Json;
    return (
      <Labelled name={name}>
        <div className="flex flex-col gap-3 rounded-md border border-ink-line/70 p-3">
          {Object.entries(obj).map(([k, v]) =>
            typeof v === "string" ? (
              <TextField key={k} name={k} value={v} onChange={(nv) => onChange({ ...obj, [k]: nv })} />
            ) : (
              <Locked key={k} name={k} />
            )
          )}
        </div>
      </Labelled>
    );
  }

  return <Locked name={name} />;
}

function isFlatObject(v: unknown): v is Json {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    Object.values(v).every((x) => typeof x === "string" || typeof x === "number")
  );
}

function Labelled({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-parchment/85">{label(name)}</span>
      {children}
    </div>
  );
}

function TextField({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  const long = isLongText(value);
  const cls =
    "w-full rounded-sm border border-ink-line bg-ink px-3 py-2 text-parchment outline-none transition-colors focus-visible:border-gold";
  return (
    <Labelled name={name}>
      {long ? (
        <textarea value={value} rows={4} onChange={(e) => onChange(e.target.value)} className={cls} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </Labelled>
  );
}

function ImageField({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(file: File) {
    setErr("");
    if (file.size > MAX_UPLOAD_BYTES) {
      setErr(m.imageTooBig);
      return;
    }
    setBusy(true);
    try {
      onChange(await uploadImage(file));
    } catch {
      setErr(strings.auth.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Labelled name={name}>
      <div className="flex flex-wrap items-center gap-3">
        {value && (
          <span className="relative size-12 overflow-hidden rounded-sm border border-ink-line bg-ink">
            <Image src={value} alt={m.siteImageCurrent} fill unoptimized className="object-contain" />
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          aria-label={m.siteImageChoose}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void pick(f);
          }}
          className="text-sm text-parchment/70 file:me-3 file:rounded-sm file:border file:border-ink-line file:bg-ink-soft file:px-3 file:py-1.5 file:text-parchment/80"
        />
      </div>
      {busy && <p className="text-xs text-parchment/60">{m.uploading}</p>}
      {err && <p className="text-xs text-tick-red">{err}</p>}
    </Labelled>
  );
}

function Locked({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-parchment/60">{label(name)}</span>
      <span className="text-xs text-parchment/40">{m.siteFieldLocked}</span>
    </div>
  );
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start rounded-sm border border-dashed border-gold/40 px-3 py-1.5 text-xs text-gold/80 transition-colors hover:border-gold hover:text-gold"
    >
      + {m.siteAddItem}
    </button>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={m.siteRemoveItem}
      title={m.siteRemoveItem}
      onClick={onClick}
      className="size-8 shrink-0 rounded-sm border border-ink-line text-parchment/50 transition-colors hover:border-tick-red hover:text-tick-red"
    >
      ✕
    </button>
  );
}
