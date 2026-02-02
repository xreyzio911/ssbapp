"use client";

import { useActionState } from "react";
import { forgotPasswordAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Email
        </label>
        <Input name="email" type="email" placeholder="nama@email.com" required />
      </div>
      {state?.message ? (
        <p className="text-sm text-[#1E453E]">{state.message}</p>
      ) : null}
      <Button type="submit" className="w-full">
        Kirim tautan
      </Button>
    </form>
  );
}
<<<<<<< HEAD

=======

>>>>>>> b330d54 (Fix route handler params for Next 16)
