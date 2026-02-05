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
          Email atau Username
        </label>
        <Input
          name="identifier"
          type="text"
          placeholder="nama@email.com atau username"
          required
        />
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


