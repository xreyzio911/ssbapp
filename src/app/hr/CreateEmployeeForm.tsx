"use client";

import { useActionState } from "react";
import { createEmployeeManualAction } from "./actions";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/inline-notice";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export function CreateEmployeeForm() {
  const [state, action] = useActionState(createEmployeeManualAction, null);
  const errorId = state?.error ? "manual-employee-error" : undefined;

  return (
    <form action={action} className="grid gap-3" noValidate>
      <div>
        <label htmlFor="manual-name" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Nama lengkap
        </label>
        <Input
          id="manual-name"
          name="name"
          placeholder="Nama lengkap karyawan"
          required
          invalid={Boolean(state?.error)}
          aria-describedby={errorId}
        />
      </div>

      <div>
        <label htmlFor="manual-username" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Username
        </label>
        <Input
          id="manual-username"
          name="username"
          placeholder="username (contoh: budi santoso)"
          required
          invalid={Boolean(state?.error)}
          aria-describedby={errorId}
        />
      </div>

      <div>
        <label htmlFor="manual-position" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Jabatan (opsional)
        </label>
        <Input id="manual-position" name="position" placeholder="Jabatan" />
      </div>

      <div>
        <label htmlFor="manual-location" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Lokasi kerja (opsional)
        </label>
        <Input id="manual-location" name="workLocation" placeholder="Lokasi kerja" />
      </div>

      <div>
        <label htmlFor="manual-password" className="mb-2 block text-sm font-medium text-[#1E453E]">
          Kata sandi sementara
        </label>
        <Input
          id="manual-password"
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

      <p className="text-xs text-[#6c6f6e]">
        Username dipakai untuk login tanpa email. Simpan kata sandi sementara sebelum dibagikan ke
        karyawan.
      </p>

      {state?.error ? <InlineNotice id={errorId} tone="error" message={state.error} /> : null}
      {state?.message ? <InlineNotice tone="success" message={state.message} /> : null}

      <FormSubmitButton className="w-full" pendingText="Membuat akun...">
        Buat akun
      </FormSubmitButton>
    </form>
  );
}
