import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { EmployeeOverviewSection } from "./_sections/EmployeeOverviewSection";

export default async function EmployeeDashboardPage() {
  const user = await requireRole(UserRole.EMPLOYEE);

  const [versions, statuses, assignments] = await Promise.all([
    prisma.documentVersion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { docType: true, createdAt: true },
    }),
    prisma.employeeDocStatus.findMany({
      where: { userId: user.id },
      select: { docType: true, needsUpdate: true },
    }),
    prisma.hrFileAssignment.findMany({
      where: { employeeId: user.id },
      select: {
        id: true,
        status: true,
        assignedAt: true,
        signedAt: true,
        hrFile: {
          select: {
            fileType: true,
            title: true,
            mimeType: true,
            size: true,
          },
        },
      },
    }),
  ]);

  const safeVersions = versions.map((version) => ({
    docType: version.docType,
    createdAt: version.createdAt.toISOString(),
  }));

  const safeStatuses = statuses.map((status) => ({
    docType: status.docType,
    needsUpdate: status.needsUpdate,
  }));

  const safeAssignments = assignments.map((assignment) => ({
    id: assignment.id,
    status: assignment.status,
    assignedAt: assignment.assignedAt.toISOString(),
    signedAt: assignment.signedAt ? assignment.signedAt.toISOString() : null,
    hrFile: {
      fileType: assignment.hrFile.fileType,
      title: assignment.hrFile.title,
      mimeType: assignment.hrFile.mimeType,
      size: assignment.hrFile.size,
    },
  }));

  return (
    <EmployeeOverviewSection
      versions={safeVersions}
      statuses={safeStatuses}
      assignments={safeAssignments}
    />
  );
}

