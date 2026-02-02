"use server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
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
