"use server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, DocType } from "@/lib/enums";
import { z } from "zod";

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
