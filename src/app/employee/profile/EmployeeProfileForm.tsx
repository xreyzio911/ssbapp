"use client";

import { useActionState } from "react";
import { updateProfileAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  email: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  dob?: string | null;
  nik?: string | null;
};

export function EmployeeProfileForm(props: Props) {
  const [state, action] = useActionState(updateProfileAction, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Nama lengkap
        </label>
        <Input value={props.name} disabled />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Email
        </label>
        <Input value={props.email} disabled />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          NIK
        </label>
        <Input name="nik" defaultValue={props.nik ?? ""} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">
            No. HP
          </label>
          <Input name="phone" defaultValue={props.phone ?? ""} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">
            Tanggal lahir
          </label>
          <Input name="dob" type="date" defaultValue={props.dob ?? ""} />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Alamat
        </label>
        <Input name="address" defaultValue={props.address ?? ""} />
      </div>
      {state?.message ? (
        <p className="text-sm text-[#1E453E]">{state.message}</p>
      ) : null}
      <Button type="submit">Simpan profil</Button>
    </form>
  );
}

