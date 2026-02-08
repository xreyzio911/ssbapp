"use client";

import { useActionState } from "react";
import { acceptInviteAction } from "./actions";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/inline-notice";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

type InviteFormProps = {
  token: string;
  email: string;
  name: string;
};

export function InviteForm({ token, email, name }: InviteFormProps) {
  const [state, action] = useActionState(acceptInviteAction, null);
  const errorId = state?.error ? "invite-error" : undefined;

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="invite-name" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Nama lengkap
        </label>
        <Input id="invite-name" value={name} disabled />
      </div>

      <div>
        <label htmlFor="invite-email" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Email
        </label>
        <Input id="invite-email" value={email} disabled />
      </div>

      <div>
        <label htmlFor="invite-password" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Kata sandi
        </label>
        <Input
          id="invite-password"
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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="invite-nik" className="mb-2 block text-sm font-medium text-[#1E453E]">
            NIK (opsional)
          </label>
          <Input id="invite-nik" name="nik" placeholder="3275..." />
        </div>
        <div>
          <label htmlFor="invite-phone" className="mb-2 block text-sm font-medium text-[#1E453E]">
            No. HP (opsional)
          </label>
          <Input id="invite-phone" name="phone" placeholder="08..." />
        </div>
      </div>

      <div>
        <label htmlFor="invite-address" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Alamat (opsional)
        </label>
        <Input id="invite-address" name="address" placeholder="Alamat lengkap" />
      </div>

      <div>
        <label htmlFor="invite-dob" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Tanggal lahir (opsional)
        </label>
        <Input id="invite-dob" name="dob" type="date" />
      </div>

      {state?.error ? <InlineNotice id={errorId} tone="error" message={state.error} /> : null}

      <FormSubmitButton className="w-full" pendingText="Mengaktifkan akun...">
        Aktifkan akun
      </FormSubmitButton>
    </form>
  );
}

