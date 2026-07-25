"use client";

// زر دفع قائمة الأعضاء إلى جدول Google، ونتيجته بجانبه.
import { useActionState } from "react";
import { syncSheet } from "@/app/manage/actions";
import SubmitButton from "@/components/auth/SubmitButton";
import { strings } from "@/lib/strings";
import type { ActionState } from "@/lib/validation/auth";

const initialState: ActionState = {};

export default function SheetSyncButton({ sheetUrl }: { sheetUrl: string }) {
  const [state, action] = useActionState(syncSheet, initialState);
  const m = strings.manage;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={action}>
          <SubmitButton idleLabel={m.sheetSync} pendingLabel={m.sheetSyncing} className="px-4 py-2 text-sm" />
        </form>
        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm border border-gold/60 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-ink"
          >
            {m.sheetOpen}
          </a>
        )}
      </div>
      {state.notice && (
        <p role="status" className="text-xs text-tick-green">
          {state.notice}
        </p>
      )}
      {state.error && (
        <p role="alert" className="max-w-xs text-xs text-tick-red">
          {state.error}
        </p>
      )}
    </div>
  );
}
