"use server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { hashPassword, verifyPassword } from "@/lib/password";
import { z } from "zod";

const schema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  dob: z.string().optional(),
  nik: z.string().optional(),
});

export async function updateProfileAction(
  _prevState: { message?: string } | null,
  formData: FormData
) {
  const user = await requireRole(UserRole.EMPLOYEE);
  const payload = {
    phone: String(formData.get("phone") || "").trim() || undefined,
    address: String(formData.get("address") || "").trim() || undefined,
    dob: String(formData.get("dob") || "").trim() || undefined,
    nik: String(formData.get("nik") || "").trim() || undefined,
  };

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { message: "Data tidak valid." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone: parsed.data.phone,
      address: parsed.data.address,
      nik: parsed.data.nik,
      dob: parsed.data.dob ? new Date(parsed.data.dob) : null,
    },
  });

  return { message: "Profil berhasil diperbarui." };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export async function changePasswordAction(
  _prevState: { message?: string; ok?: boolean } | null,
  formData: FormData
) {
  const user = await requireRole(UserRole.EMPLOYEE);
  const payload = {
    currentPassword: String(formData.get("currentPassword") || ""),
    newPassword: String(formData.get("newPassword") || ""),
    confirmPassword: String(formData.get("confirmPassword") || ""),
  };

  const parsed = passwordSchema.safeParse(payload);
  if (!parsed.success) {
    return { message: "Kata sandi tidak valid. Minimal 8 karakter." };
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { message: "Konfirmasi kata sandi tidak cocok." };
  }
  if (parsed.data.newPassword === parsed.data.currentPassword) {
    return { message: "Kata sandi baru harus berbeda." };
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) {
    return { message: "User tidak ditemukan." };
  }

  const ok = await verifyPassword(parsed.data.currentPassword, record.passwordHash);
  if (!ok) {
    return { message: "Kata sandi lama salah." };
  }

  const nextHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: nextHash },
  });

  return { message: "Kata sandi berhasil diperbarui.", ok: true };
}

