"use client";

import { useActionState } from "react";
import { inviteEmployeeAction } from "./actions";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/inline-notice";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export function InviteEmployeeForm() {
  const [state, action] = useActionState(inviteEmployeeAction, null);
  const errorId = state?.error ? "invite-employee-error" : undefined;

  return (
    <form action={action} className="grid gap-3" noValidate>
      <div>
        <label htmlFor="invite-employee-name" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Nama lengkap
        </label>
        <Input
          id="invite-employee-name"
          name="name"
          placeholder="Nama lengkap karyawan"
          required
          invalid={Boolean(state?.error)}
          aria-describedby={errorId}
        />
      </div>

      <div>
        <label htmlFor="invite-employee-email" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Email
        </label>
        <Input
          id="invite-employee-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="email@contoh.com"
          required
          invalid={Boolean(state?.error)}
          aria-describedby={errorId}
        />
      </div>

      {state?.error ? <InlineNotice id={errorId} tone="error" message={state.error} /> : null}
      {state?.message ? <InlineNotice tone="success" message={state.message} /> : null}

      <FormSubmitButton className="w-full" pendingText="Mengirim undangan...">
        Undang
      </FormSubmitButton>
    </form>
  );
}
