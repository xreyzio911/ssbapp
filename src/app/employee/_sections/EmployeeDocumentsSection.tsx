import { Card } from "@/components/ui/card";
import { DOC_TYPES } from "@/lib/constants";
import { DocumentUploadCard } from "../documents/DocumentUploadCard";
import type { EmployeeDocStatus, EmployeeDocVersion } from "./types";
import {
  buildLatestByType,
  buildNeedsUpdateByType,
  getUploadStatus,
} from "./document-status";

type EmployeeDocumentsSectionProps = {
  versions: EmployeeDocVersion[];
  statuses: EmployeeDocStatus[];
};

export function EmployeeDocumentsSection({
  versions,
  statuses,
}: EmployeeDocumentsSectionProps) {
  const latestByType = buildLatestByType(versions);
  const statusByType = buildNeedsUpdateByType(statuses);

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#1E453E]">Unggah Dokumen Pribadi</h2>
        <p className="text-sm text-[#6c6f6e]">Ukuran maksimal 10MB. Format PDF/JPG/PNG.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {DOC_TYPES.map((doc) => {
          const latest = latestByType.get(doc.type);
          const needsUpdate = statusByType.get(doc.type);
          const status = getUploadStatus({ latest, needsUpdate });

          return (
            <DocumentUploadCard
              key={doc.type}
              docType={doc.type}
              label={doc.label}
              status={status}
              lastUploaded={latest ? new Date(latest).toLocaleDateString("id-ID") : undefined}
            />
          );
        })}
      </div>
    </Card>
  );
}
