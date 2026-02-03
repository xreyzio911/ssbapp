import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { EmployeeTabsContent } from "./EmployeeTabsContent";

export default async function EmployeeDashboard() {
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
      include: { hrFile: true },
      orderBy: { assignedAt: "desc" },
    }),
  ]);

  const safeUser = {
    email: user.email,
    name: user.name,
    phone: user.phone,
    address: user.address,
    dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
    nik: user.nik,
  };

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
    <EmployeeTabsContent
      user={safeUser}
      versions={safeVersions}
      statuses={safeStatuses}
      assignments={safeAssignments}
    />
  );
}

