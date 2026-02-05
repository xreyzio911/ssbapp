"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/lib/enums";
import { generateToken, hashToken } from "@/lib/crypto";
import { sendEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { normalizeUsername } from "@/lib/username";
import { z } from "zod";

const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const manualSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(2),
  password: z.string().min(8),
  position: z.string().optional(),
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

  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const link = `${appUrl}/invite?token=${token}`;
  const loginUrl = `${appUrl}/login`;

  await sendEmail({
    to: parsed.data.email,
    subject: "Undangan akun Portal Dokumen Manpower",
    html: `
      <div style="font-family: Arial, sans-serif; color: #1E453E; line-height: 1.6;">
        <p>Halo ${parsed.data.name},</p>
        <p>Anda diundang untuk mengakses Portal Dokumen Manpower.</p>
        <p>Aktifkan akun Anda melalui tombol berikut:</p>
        <p>
          <a href="${link}" style="display: inline-block; padding: 10px 18px; border-radius: 999px; background: #1E453E; color: #ffffff; text-decoration: none; font-weight: 600;">
            Aktifkan Akun
          </a>
        </p>
        <p style="font-size: 12px; color: #6c6f6e;">
          Jika tombol tidak berfungsi, buka tautan berikut:
          <a href="${link}" style="color: #1E453E;">${link}</a>
        </p>
        <p style="font-size: 12px; color: #6c6f6e;">Tautan berlaku 7 hari.</p>
        <p style="font-size: 12px; color: #6c6f6e;">
          Setelah aktivasi, Anda dapat masuk melalui:
          <a href="${loginUrl}" style="color: #1E453E;">${loginUrl}</a>
        </p>
        <p style="font-size: 12px; color: #6c6f6e;">
          Jika Anda tidak merasa mendaftar, Anda dapat mengabaikan email ini.
        </p>
      </div>
    `,
  });

  return { message: "Undangan berhasil dikirim." };
}

export async function createEmployeeManualAction(
  _prevState: { message?: string; error?: string } | null,
  formData: FormData
) {
  await requireRole(UserRole.HR);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    username: String(formData.get("username") || "").trim(),
    password: String(formData.get("password") || ""),
    position: String(formData.get("position") || "").trim() || undefined,
  };

  const parsed = manualSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Nama, username, atau kata sandi tidak valid." };
  }

  const username = normalizeUsername(parsed.data.username);
  if (!username) {
    return { error: "Username tidak valid." };
  }

  const existing = await prisma.user.findUnique({
    where: { username },
  });
  if (existing) {
    return { error: "Username sudah digunakan." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.create({
    data: {
      role: UserRole.EMPLOYEE,
      name: parsed.data.name,
      username,
      email: null,
      passwordHash,
      position: parsed.data.position,
    },
  });

  return { message: "Akun karyawan berhasil dibuat." };
}

