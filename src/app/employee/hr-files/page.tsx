import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { HrFileCard } from "./HrFileCard";
import { UserRole } from "@prisma/client";

export default async function EmployeeHrFilesPage() {
  const user = await requireRole(UserRole.EMPLOYEE);

  const assignments = await prisma.hrFileAssignment.findMany({
    where: { employeeId: user.id },
    include: { hrFile: true },
    orderBy: { assignedAt: "desc" },
  });

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#1E453E]">
          Dokumen dari HR
        </h2>
        <p className="text-sm text-[#6c6f6e]">
          Gunakan kata sandi dari email untuk membuka dokumen.
        </p>
      </div>
      {assignments.length === 0 ? (
        <p className="text-sm text-[#6c6f6e]">
          Belum ada dokumen dari HR.
        </p>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <HrFileCard
              key={assignment.id}
              assignment={{
                id: assignment.id,
                status: assignment.status,
                fileType: assignment.hrFile.fileType,
                title: assignment.hrFile.title,
                mimeType: assignment.hrFile.mimeType,
                size: assignment.hrFile.size,
                assignedAt: assignment.assignedAt.toISOString(),
                signedAt: assignment.signedAt?.toISOString() ?? null,
              }}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
