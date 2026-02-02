"use server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, DocType } from "@prisma/client";
import { z } from "zod";
import {
  decryptFileKeyWithMaster,
  encryptFileKeyWithPassword,
  generateToken,
} from "@/lib/crypto";
import { hashPassword } from "@/lib/password";
import { sendEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

const profileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dob: z.string().optional(),
  nik: z.string().optional(),
});

export async function updateEmployeeProfileAction(
  _prevState: { message?: string; error?: string } | null,
  formData: FormData
) {
  await requireRole(UserRole.HR);
  const payload = {
    id: String(formData.get("id") || ""),
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").toLowerCase().trim(),
    phone: String(formData.get("phone") || "").trim() || undefined,
    address: String(formData.get("address") || "").trim() || undefined,
    dob: String(formData.get("dob") || "").trim() || undefined,
    nik: String(formData.get("nik") || "").trim() || undefined,
  };

  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Data profil tidak valid." };
  }

  await prisma.user.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      address: parsed.data.address,
      nik: parsed.data.nik,
      dob: parsed.data.dob ? new Date(parsed.data.dob) : null,
    },
  });

  return { message: "Profil karyawan diperbarui." };
}

export async function markDocNeedsUpdateAction(
  _prevState: { message?: string; error?: string } | null,
  formData: FormData
) {
  await requireRole(UserRole.HR);
  const employeeId = String(formData.get("employeeId") || "");
  const docType = String(formData.get("docType") || "") as DocType;
  const needsUpdate = String(formData.get("needsUpdate") || "") === "true";

  if (!employeeId || !docType) {
    return { error: "Data tidak lengkap." };
  }

  await prisma.employeeDocStatus.upsert({
    where: { userId_docType: { userId: employeeId, docType } },
    create: { userId: employeeId, docType, needsUpdate },
    update: { needsUpdate },
  });

  return { message: "Status dokumen diperbarui." };
}

export async function reissuePasswordAction(
  _prevState: { message?: string; error?: string } | null,
  formData: FormData
) {
  const hrUser = await requireRole(UserRole.HR);
  const assignmentId = String(formData.get("assignmentId") || "");
  if (!assignmentId) {
    return { error: "Data tidak lengkap." };
  }

  const assignment = await prisma.hrFileAssignment.findUnique({
    where: { id: assignmentId },
    include: { hrFile: true, employee: true },
  });
  if (!assignment) {
    return { error: "Data tidak ditemukan." };
  }
  if (!assignment.employee.email) {
    return { error: "Email karyawan belum tersedia." };
  }

  const fileKey = decryptFileKeyWithMaster(
    Buffer.from(assignment.hrFile.fileKeyEncMaster, "base64"),
    Buffer.from(assignment.hrFile.fileKeyEncMasterIv, "base64")
  );

  const newPassword = generateToken(12);
  const kdfPayload = encryptFileKeyWithPassword(fileKey, newPassword);
  const passwordHash = await hashPassword(newPassword);

  await prisma.hrFileAssignment.update({
    where: { id: assignmentId },
    data: {
      passwordHash,
      passwordKdfSalt: kdfPayload.salt.toString("base64"),
      passwordKdfIterations: kdfPayload.iterations,
      passwordKdfIv: kdfPayload.iv.toString("base64"),
      fileKeyEncPassword: kdfPayload.ciphertext.toString("base64"),
      lastPasswordIssuedAt: new Date(),
    },
  });

  await sendEmail({
    to: assignment.employee.email,
    subject: "Kata sandi dokumen HR diperbarui",
    html: `
      <p>Halo ${assignment.employee.name},</p>
      <p>Kata sandi baru untuk dokumen "${assignment.hrFile.title}":</p>
      <p><strong>${newPassword}</strong></p>
      <p>Simpan kata sandi ini untuk membuka dokumen.</p>
    `,
  });

  await logAudit({
    actorId: hrUser.id,
    actorRole: UserRole.HR,
    action: "PASSWORD_REISSUE",
    targetType: "HrFileAssignment",
    targetId: assignment.id,
  });

  return { message: "Kata sandi baru sudah dikirim." };
}
