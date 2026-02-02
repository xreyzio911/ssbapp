"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Kata sandi baru
        </label>
        <Input name="password" type="password" placeholder="Minimal 8 karakter" required />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full">
        Simpan kata sandi baru
      </Button>
    </form>
  );
}


