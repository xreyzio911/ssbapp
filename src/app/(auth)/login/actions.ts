"use server";

import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { z } from "zod";
import { redirect } from "next/navigation";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const payload = {
    email: String(formData.get("email") || "").toLowerCase().trim(),
    password: String(formData.get("password") || ""),
  };

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Email atau kata sandi tidak valid." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) {
    return { error: "Email atau kata sandi salah." };
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { error: "Email atau kata sandi salah." };
  }

  await createSession(user.id);
  redirect("/");
}
