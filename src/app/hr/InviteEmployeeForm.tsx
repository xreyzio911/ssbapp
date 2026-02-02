"use client";

import { useActionState } from "react";
import { inviteEmployeeAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InviteEmployeeForm() {
  const [state, action] = useActionState(inviteEmployeeAction, null);

  return (
    <form action={action} className="grid gap-3 md:grid-cols-[1.2fr_1.2fr_auto]">
      <Input name="name" placeholder="Nama lengkap karyawan" required />
      <Input name="email" type="email" placeholder="email@contoh.com" required />
      <Button type="submit">Undang</Button>
      {state?.error ? (
        <p className="text-sm text-red-600 md:col-span-3">{state.error}</p>
      ) : null}
      {state?.message ? (
        <p className="text-sm text-[#1E453E] md:col-span-3">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
<<<<<<< HEAD

=======

>>>>>>> b330d54 (Fix route handler params for Next 16)
