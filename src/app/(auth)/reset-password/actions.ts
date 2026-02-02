"use server";

import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/crypto";
import { hashPassword } from "@/lib/password";
import { z } from "zod";
import { redirect } from "next/navigation";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function resetPasswordAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const payload = {
    token: String(formData.get("token") || ""),
    password: String(formData.get("password") || ""),
  };

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Token atau kata sandi tidak valid." };
  }

  const record = await prisma.passwordReset.findFirst({
    where: {
      tokenHash: hashToken(parsed.data.token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    return { error: "Token sudah kedaluwarsa atau tidak valid." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  redirect("/login");
}
