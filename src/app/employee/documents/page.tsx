import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DOC_TYPES } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { DocumentUploadCard } from "./DocumentUploadCard";
import { UserRole } from "@/lib/enums";

export default async function EmployeeDocumentsPage() {
  const user = await requireRole(UserRole.EMPLOYEE);

  const [versions, statuses] = await Promise.all([
    prisma.documentVersion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.employeeDocStatus.findMany({
      where: { userId: user.id },
    }),
  ]);

  const latestByType = new Map<string, Date>();
  versions.forEach((version: { docType: string; createdAt: Date }) => {
    if (!latestByType.has(version.docType)) {
      latestByType.set(version.docType, version.createdAt);
    }
  });
  const statusByType = new Map<string, boolean>();
  statuses.forEach((s: { docType: string; needsUpdate: boolean }) => {
    statusByType.set(s.docType, s.needsUpdate);
  });

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#1E453E]">
          Unggah Dokumen Pribadi
        </h2>
        <p className="text-sm text-[#6c6f6e]">
          Ukuran maksimal 15MB. Format PDF/JPG/PNG.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {DOC_TYPES.map((doc) => {
          const latest = latestByType.get(doc.type);
          const needsUpdate = statusByType.get(doc.type);
          const status = latest
            ? needsUpdate
              ? "Perlu pembaruan"
              : "Sudah diunggah"
            : "Belum diunggah";
          return (
            <DocumentUploadCard
              key={doc.type}
              docType={doc.type}
              label={doc.label}
              status={status}
              lastUploaded={latest?.toLocaleDateString("id-ID")}
            />
          );
        })}
      </div>
    </Card>
  );
}

