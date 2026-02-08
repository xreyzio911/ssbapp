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
};

export function DocStatusToggle({ employeeId, docType, needsUpdate }: Props) {
  const [state, action] = useActionState(markDocNeedsUpdateAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.message) {
      router.refresh();
    }
  }, [state?.message, router]);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="docType" value={docType} />
      <input type="hidden" name="needsUpdate" value={(!needsUpdate).toString()} />

      <FormSubmitButton variant="ghost" pendingText="Menyimpan...">
        {needsUpdate ? "Tandai lengkap" : "Minta pembaruan"}
      </FormSubmitButton>

      {state?.message ? <InlineNotice tone="success" message={state.message} /> : null}
      {state?.error ? <InlineNotice tone="error" message={state.error} /> : null}
    </form>
  );
}
