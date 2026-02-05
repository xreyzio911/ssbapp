"use client";

import { useActionState } from "react";
import { createEmployeeManualAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateEmployeeForm() {
  const [state, action] = useActionState(createEmployeeManualAction, null);

  return (
    <form action={action} className="grid gap-3">
      <Input name="name" placeholder="Nama lengkap karyawan" required />
      <Input
        name="username"
        placeholder="username (contoh: budi santoso)"
        required
      />
      <Input name="position" placeholder="Jabatan (opsional)" />
      <Input name="workLocation" placeholder="Lokasi kerja (opsional)" />
      <Input
        name="password"
        type="password"
        placeholder="Kata sandi sementara"
        required
      />
      <p className="text-xs text-[#6c6f6e]">
        Username dipakai untuk login tanpa email. Simpan kata sandi sementara
        sebelum dibagikan ke karyawan.
      </p>
      <Button type="submit" className="w-full">
        Buat akun
      </Button>
      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      {state?.message ? (
        <p className="text-sm text-[#1E453E]">{state.message}</p>
      ) : null}
    </form>
  );
}
