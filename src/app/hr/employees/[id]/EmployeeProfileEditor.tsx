"use client";

import { useActionState } from "react";
import { updateEmployeeProfileAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  dob?: string | null;
  nik?: string | null;
};

export function EmployeeProfileEditor(props: Props) {
  const [state, action] = useActionState(updateEmployeeProfileAction, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={props.id} />
      <div>
        <label className="mb-1 block text-xs font-medium text-[#1E453E]">
          Nama lengkap
        </label>
        <Input name="name" defaultValue={props.name} required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[#1E453E]">
          Email
        </label>
        <Input name="email" type="email" defaultValue={props.email} required />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#1E453E]">
            NIK
          </label>
          <Input name="nik" defaultValue={props.nik ?? ""} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#1E453E]">
            No. HP
          </label>
          <Input name="phone" defaultValue={props.phone ?? ""} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[#1E453E]">
          Alamat
        </label>
        <Input name="address" defaultValue={props.address ?? ""} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[#1E453E]">
          Tanggal lahir
        </label>
        <Input name="dob" type="date" defaultValue={props.dob ?? ""} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit">Simpan perubahan</Button>
        {state?.message ? (
          <span className="text-xs text-[#1E453E]">{state.message}</span>
        ) : null}
        {state?.error ? (
          <span className="text-xs text-red-600">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
