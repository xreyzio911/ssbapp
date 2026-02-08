"use client";

import { useActionState } from "react";
import { forgotPasswordAction } from "./actions";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/inline-notice";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, null);
  const errorId = state?.error ? "forgot-password-error" : undefined;

  return (
    <form action={action} className="space-y-4" noValidate>
      <div>
        <label htmlFor="forgot-email" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Email
        </label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          required
          invalid={Boolean(state?.error)}
          aria-describedby={errorId}
        />
      </div>
      {state?.error ? <InlineNotice id={errorId} tone="error" message={state.error} /> : null}
      {state?.message ? <InlineNotice tone="info" message={state.message} /> : null}
      <FormSubmitButton className="w-full" pendingText="Mengirim...">
        Kirim tautan
      </FormSubmitButton>
    </form>
  );
}

