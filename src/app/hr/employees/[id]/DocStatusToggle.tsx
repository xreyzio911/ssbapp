"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { markDocNeedsUpdateAction } from "./actions";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { InlineNotice } from "@/components/ui/inline-notice";

type Props = {
  employeeId: string;
  docType: string;
  needsUpdate: boolean;
  currentNote?: string | null;
};

export function DocStatusToggle({
  employeeId,
  docType,
  needsUpdate,
  currentNote,
}: Props) {
  const [state, action] = useActionState(markDocNeedsUpdateAction, null);
  const router = useRouter();
  const noteInputId = `update-note-${docType.toLowerCase()}`;

  useEffect(() => {
    if (state?.message) {
      router.refresh();
    }
  }, [state?.message, router]);

  return (
    <form action={action} className="w-full space-y-2">
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="docType" value={docType} />

      {needsUpdate ? (
        <>
          <input type="hidden" name="needsUpdate" value="false" />
          {currentNote ? (
            <p className="rounded-xl border border-[#D4AF37]/40 bg-[#fff7e1] px-3 py-2 text-xs text-[#1E453E]">
              Catatan HR: {currentNote}
            </p>
          ) : null}
          <FormSubmitButton variant="ghost" pendingText="Menyimpan...">
            Tandai lengkap
          </FormSubmitButton>
        </>
      ) : (
        <>
          <input type="hidden" name="needsUpdate" value="true" />
          <label htmlFor={noteInputId} className="block text-xs font-medium text-[#6c6f6e]">
            Catatan pembaruan
          </label>
          <textarea
            id={noteInputId}
            name="note"
            rows={3}
            required
            maxLength={500}
            placeholder="Contoh: Mohon unggah ulang KTP dengan foto tidak buram."
            className="w-full min-h-24 rounded-xl border border-[#1E453E]/15 bg-white px-4 py-3 text-sm leading-5 text-[#1B1B1B] shadow-sm transition placeholder:text-sm placeholder:text-[#7a7a7a] focus:border-[#1E453E] focus:outline-none focus:ring-2 focus:ring-[#1E453E]/20"
            aria-describedby={`${noteInputId}-hint`}
          />
          <p id={`${noteInputId}-hint`} className="text-[11px] leading-4 text-[#6c6f6e]">
            Catatan akan tampil di sisi karyawan.
          </p>
          <FormSubmitButton variant="ghost" pendingText="Menyimpan...">
            Minta pembaruan
          </FormSubmitButton>
        </>
      )}

      {state?.message ? (
        <InlineNotice className="mt-2" tone="success" message={state.message} />
      ) : null}
      {state?.error ? (
        <InlineNotice className="mt-2" tone="error" message={state.error} />
      ) : null}
    </form>
  );
}
