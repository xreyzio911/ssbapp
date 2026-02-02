"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/lib/enums";
import { generateToken, hashToken } from "@/lib/crypto";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function inviteEmployeeAction(
  _prevState: { message?: string; error?: string } | null,
  formData: FormData
) {
  const hrUser = await requireRole(UserRole.HR);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").toLowerCase().trim(),
  };

  const parsed = inviteSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Nama atau email tidak valid." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existingUser) {
    return { error: "Email sudah terdaftar." };
  }

  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.invitation.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      tokenHash,
      expiresAt,
      invitedById: hrUser.id,
    },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const link = `${appUrl}/invite?token=${token}`;

  await sendEmail({
    to: parsed.data.email,
    subject: "Undangan akun Portal Dokumen Manpower",
    html: `
      <p>Halo ${parsed.data.name},</p>
      <p>Anda diundang untuk mengakses Portal Dokumen Manpower.</p>
      <p>Aktifkan akun melalui tautan berikut:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Tautan berlaku 7 hari.</p>
    `,
  });

  return { message: "Undangan berhasil dikirim." };
}

