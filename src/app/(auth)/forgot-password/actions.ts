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

  if (user?.email) {
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

    const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const link = `${appUrl}/reset-password?token=${token}`;
    const loginUrl = `${appUrl}/login`;

    await sendEmail({
      to: user.email,
      subject: "Atur ulang kata sandi",
      html: `
        <div style="font-family: Arial, sans-serif; color: #1E453E; line-height: 1.6;">
          <p>Halo ${user.name},</p>
          <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda.</p>
          <p>Gunakan tombol berikut untuk melanjutkan:</p>
          <p>
            <a href="${link}" style="display: inline-block; padding: 10px 18px; border-radius: 999px; background: #1E453E; color: #ffffff; text-decoration: none; font-weight: 600;">
              Atur Ulang Kata Sandi
            </a>
          </p>
          <p style="font-size: 12px; color: #6c6f6e;">
            Jika tombol tidak berfungsi, buka tautan berikut:
            <a href="${link}" style="color: #1E453E;">${link}</a>
          </p>
          <p style="font-size: 12px; color: #6c6f6e;">Tautan ini berlaku 24 jam.</p>
          <p style="font-size: 12px; color: #6c6f6e;">
            Jika Anda tidak meminta reset, abaikan email ini dan kata sandi Anda tidak akan berubah.
          </p>
          <p style="font-size: 12px; color: #6c6f6e;">
            Login kembali di:
            <a href="${loginUrl}" style="color: #1E453E;">${loginUrl}</a>
          </p>
        </div>
      `,
    });
  }

  return {
    message:
      "Jika email terdaftar, kami akan mengirim tautan pengaturan ulang.",
  };
}
