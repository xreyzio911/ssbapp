"use client";

import { useActionState } from "react";
import { inviteEmployeeAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InviteEmployeeForm() {
  const [state, action] = useActionState(inviteEmployeeAction, null);

  return (
    <form action={action} className="grid gap-3">
      <Input name="name" placeholder="Nama lengkap karyawan" required />
      <Input name="email" type="email" placeholder="email@contoh.com" required />
      <Button type="submit" className="w-full">
        Undang
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


