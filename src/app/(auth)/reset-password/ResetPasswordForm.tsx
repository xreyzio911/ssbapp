"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "./actions";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/inline-notice";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);
  const errorId = state?.error ? "reset-password-error" : undefined;

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="reset-password" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Kata sandi baru
        </label>
        <Input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          required
          minLength={8}
          invalid={Boolean(state?.error)}
          aria-describedby={errorId}
        />
      </div>
      {state?.error ? <InlineNotice id={errorId} tone="error" message={state.error} /> : null}
      <FormSubmitButton className="w-full" pendingText="Menyimpan...">
        Simpan kata sandi baru
      </FormSubmitButton>
    </form>
  );
}

