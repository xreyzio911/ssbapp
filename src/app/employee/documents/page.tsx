import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { EmployeeDocumentsSection } from "../_sections/EmployeeDocumentsSection";

export default async function EmployeeDocumentsPage() {
  const user = await requireRole(UserRole.EMPLOYEE);

  const [versions, statuses] = await Promise.all([
    prisma.documentVersion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { docType: true, createdAt: true },
    }),
    prisma.employeeDocStatus.findMany({
      where: { userId: user.id },
      select: { docType: true, needsUpdate: true, updateNote: true },
    }),
  ]);

  const safeVersions = versions.map((version) => ({
    docType: version.docType,
    createdAt: version.createdAt.toISOString(),
  }));

  const safeStatuses = statuses.map((status) => ({
    docType: status.docType,
    needsUpdate: status.needsUpdate,
    updateNote: status.updateNote,
  }));

  return <EmployeeDocumentsSection versions={safeVersions} statuses={safeStatuses} />;
}

