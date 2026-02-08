import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { EmployeeHrFilesSection } from "../_sections/EmployeeHrFilesSection";

export default async function EmployeeHrFilesPage() {
  const user = await requireRole(UserRole.EMPLOYEE);

  const assignments = await prisma.hrFileAssignment.findMany({
    where: { employeeId: user.id },
    include: {
      hrFile: {
        select: {
          fileType: true,
          title: true,
          mimeType: true,
          size: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

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
    <EmployeeHrFilesSection
      assignments={safeAssignments}
      hasSignature={Boolean(user.signaturePath)}
      signerName={user.name}
    />
  );
}

