import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { HrFileCard } from "../hr-files/HrFileCard";
import type { EmployeeHrAssignment } from "./types";

type EmployeeHrFilesSectionProps = {
  assignments: EmployeeHrAssignment[];
  hasSignature: boolean;
  signerName: string;
};

export function EmployeeHrFilesSection({
  assignments,
  hasSignature,
  signerName,
}: EmployeeHrFilesSectionProps) {
  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#1E453E]">Dokumen dari HR</h2>
        <p className="text-sm text-[#6c6f6e]">Dokumen dapat dibuka langsung setelah login.</p>
      </div>
      {assignments.length === 0 ? (
        <EmptyState
          title="Belum ada dokumen dari HR"
          description="Dokumen baru dari HR akan muncul di sini."
        />
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
                assignedAt: assignment.assignedAt,
                signedAt: assignment.signedAt,
              }}
              hasSignature={hasSignature}
              signerName={signerName}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
