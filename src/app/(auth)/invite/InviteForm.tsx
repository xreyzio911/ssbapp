"use client";

import { useActionState } from "react";
import { acceptInviteAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type InviteFormProps = {
  token: string;
  email: string;
  name: string;
};

export function InviteForm({ token, email, name }: InviteFormProps) {
  const [state, action] = useActionState(acceptInviteAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Nama lengkap
        </label>
        <Input value={name} disabled />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Email
        </label>
        <Input value={email} disabled />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Kata sandi
        </label>
        <Input name="password" type="password" placeholder="Minimal 8 karakter" required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">
            NIK (opsional)
          </label>
          <Input name="nik" placeholder="3275..." />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">
            No. HP (opsional)
          </label>
          <Input name="phone" placeholder="08..." />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Alamat (opsional)
        </label>
        <Input name="address" placeholder="Alamat lengkap" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Tanggal lahir (opsional)
        </label>
        <Input name="dob" type="date" />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full">
        Aktifkan akun
      </Button>
    </form>
  );
}


