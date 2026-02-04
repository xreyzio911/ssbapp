"use server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, DocType } from "@/lib/enums";

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
