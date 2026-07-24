// قائمة اختيار مُسمّاة — نفس هيكل Field، لكن لعنصر select بخيارات أبناء.
import type { ReactNode, SelectHTMLAttributes } from "react";

type SelectFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "children">;

export default function SelectField({
  id,
  label,
  error,
  hint,
  children,
  className,
  ...selectProps
}: SelectFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-parchment/85">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-sm border bg-ink px-3.5 py-2.5 text-parchment outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-gold/60 ${
          error ? "border-tick-red" : "border-ink-line focus-visible:border-gold"
        } ${className ?? ""}`}
        {...selectProps}
      >
        {children}
      </select>
      {hint && !error && (
        <p id={hintId} className="text-xs text-parchment/50">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-tick-red">
          {error}
        </p>
      )}
    </div>
  );
}
