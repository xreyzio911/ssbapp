"use server";

import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/crypto";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function forgotPasswordAction(
  _prevState: { message?: string } | null,
  formData: FormData
) {
  const payload = {
    email: String(formData.get("email") || "").toLowerCase().trim(),
  };
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { message: "Email tidak valid." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (user) {
    const token = generateToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const link = `${appUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Atur ulang kata sandi",
      html: `
        <p>Halo ${user.name},</p>
        <p>Klik tautan berikut untuk mengatur ulang kata sandi:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Tautan ini berlaku 24 jam.</p>
      `,
    });
  }

  return {
    message:
      "Jika email terdaftar, kami akan mengirim tautan pengaturan ulang.",
  };
}
