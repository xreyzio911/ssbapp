"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Email
        </label>
        <Input name="email" type="email" placeholder="nama@email.com" required />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Kata sandi
        </label>
        <Input name="password" type="password" placeholder="********" required />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full">
        Masuk
      </Button>
    </form>
  );
}
<<<<<<< HEAD

=======

>>>>>>> b330d54 (Fix route handler params for Next 16)
