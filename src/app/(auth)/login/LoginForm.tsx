"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/inline-notice";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, null);
  const errorId = state?.error ? "login-error" : undefined;

  return (
    <form action={action} className="space-y-4" noValidate>
      <div>
        <label htmlFor="login-identifier" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Email atau Username
        </label>
        <Input
          id="login-identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="nama@email.com atau username"
          required
          invalid={Boolean(state?.error)}
          aria-describedby={errorId}
        />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Kata sandi
        </label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="********"
          required
          invalid={Boolean(state?.error)}
          aria-describedby={errorId}
        />
      </div>
      {state?.error ? <InlineNotice id={errorId} tone="error" message={state.error} /> : null}
      <FormSubmitButton className="w-full" pendingText="Memproses...">
        Masuk
      </FormSubmitButton>
    </form>
  );
}

