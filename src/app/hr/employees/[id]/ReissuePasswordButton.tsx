"use client";

import { useActionState } from "react";
import { reissuePasswordAction } from "./actions";
import { Button } from "@/components/ui/button";

export function ReissuePasswordButton({ assignmentId }: { assignmentId: string }) {
  const [state, action] = useActionState(reissuePasswordAction, null);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <Button type="submit" variant="secondary">
        Kirim ulang kata sandi
      </Button>
      {state?.message ? (
        <span className="text-xs text-[#1E453E]">{state.message}</span>
      ) : null}
      {state?.error ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}
    </form>
  );
}
}
