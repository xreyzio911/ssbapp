"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { markDocNeedsUpdateAction } from "./actions";
import { Button } from "@/components/ui/button";

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
      <Button type="submit" variant="ghost">
        {needsUpdate ? "Tandai lengkap" : "Minta pembaruan"}
      </Button>
      {state?.message ? (
        <span className="text-xs text-[#1E453E]">{state.message}</span>
      ) : null}
    </form>
  );
}
}
