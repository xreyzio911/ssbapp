"use server";

import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/crypto";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";
import { z } from "zod";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
  phone: z.string().optional(),
  address: z.string().optional(),
  dob: z.string().optional(),
  nik: z.string().optional(),
});

export async function acceptInviteAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const payload = {
    token: String(formData.get("token") || ""),
    password: String(formData.get("password") || ""),
    phone: String(formData.get("phone") || "").trim() || undefined,
    address: String(formData.get("address") || "").trim() || undefined,
    dob: String(formData.get("dob") || "").trim() || undefined,
    nik: String(formData.get("nik") || "").trim() || undefined,
  };

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Data tidak lengkap." };
  }

  const invite = await prisma.invitation.findFirst({
    where: {
      tokenHash: hashToken(parsed.data.token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!invite) {
    return { error: "Undangan tidak valid atau sudah kedaluwarsa." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: invite.email },
  });
  if (existing) {
    return { error: "Akun sudah terdaftar. Silakan masuk." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      role: UserRole.EMPLOYEE,
      email: invite.email,
      name: invite.name,
      passwordHash,
      phone: parsed.data.phone,
      address: parsed.data.address,
      nik: parsed.data.nik,
      dob: parsed.data.dob ? new Date(parsed.data.dob) : undefined,
    },
  });

  await prisma.invitation.update({
    where: { id: invite.id },
    data: { usedAt: new Date() },
  });

  await createSession(user.id);
  redirect("/employee");
}
