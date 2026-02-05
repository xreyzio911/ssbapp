"use server";

import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { normalizeUsername } from "@/lib/username";
import { z } from "zod";
import { redirect } from "next/navigation";

const schema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(8),
});

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const payload = {
    identifier: String(formData.get("identifier") || "").trim(),
    password: String(formData.get("password") || ""),
  };

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Username/email atau kata sandi tidak valid." };
  }

  const identifier = parsed.data.identifier.trim();
  const emailCandidate = identifier.toLowerCase();
  const usernameCandidate = normalizeUsername(identifier);
  const isEmail = identifier.includes("@");
  const user = await prisma.user.findFirst({
    where: {
      OR: isEmail
        ? [{ email: { equals: emailCandidate, mode: "insensitive" } }]
        : [{ username: { equals: usernameCandidate, mode: "insensitive" } }],
    },
  });
  if (!user) {
    return { error: "Username/email atau kata sandi salah." };
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { error: "Username/email atau kata sandi salah." };
  }

  await createSession(user.id);
  redirect("/");
}
