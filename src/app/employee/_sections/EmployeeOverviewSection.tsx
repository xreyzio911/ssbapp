import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DOC_TYPES } from "@/lib/constants";
import type { EmployeeDocStatus, EmployeeDocVersion, EmployeeHrAssignment } from "./types";
import {
  buildLatestByType,
  buildNeedsUpdateByType,
  getUploadStatus,
} from "./document-status";

type EmployeeOverviewSectionProps = {
  versions: EmployeeDocVersion[];
  statuses: EmployeeDocStatus[];
  assignments: EmployeeHrAssignment[];
};

export function EmployeeOverviewSection({
  versions,
  statuses,
  assignments,
}: EmployeeOverviewSectionProps) {
  const latestByType = buildLatestByType(versions);
  const statusByType = buildNeedsUpdateByType(statuses);

  const pending = assignments.filter((assignment) => assignment.status === "PENDING").length;
  const signed = assignments.filter((assignment) => assignment.status === "SIGNED").length;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">Ringkasan Dokumen</h2>
        <p className="text-sm text-[#6c6f6e]">Pastikan semua dokumen wajib sudah diunggah.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {DOC_TYPES.map((doc) => {
            const latest = latestByType.get(doc.type);
            const statusInfo = statusByType.get(doc.type);
            const needsUpdate = statusInfo?.needsUpdate;
            const status = getUploadStatus({ latest, needsUpdate });
            const tone =
              status === "Sudah diunggah"
                ? "green"
                : status === "Perlu pembaruan"
                  ? "yellow"
                  : "gray";

            return (
              <div
                key={doc.type}
                className="flex items-center justify-between rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#1E453E]">{doc.label}</p>
                  <p className="text-xs text-[#6c6f6e]">
                    {latest
                      ? `Terakhir: ${new Date(latest).toLocaleDateString("id-ID")}`
                      : "Belum ada file"}
                  </p>
                  {statusInfo?.needsUpdate && statusInfo.updateNote ? (
                    <p className="mt-1 text-xs text-[#7c4a00]">
                      Catatan HR: {statusInfo.updateNote}
                    </p>
                  ) : null}
                </div>
                <Badge tone={tone}>{status}</Badge>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">Dokumen dari HR</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-3">
            <p className="text-xs uppercase text-[#6c6f6e]">Menunggu</p>
            <p className="text-xl font-semibold text-[#1E453E]">{pending}</p>
          </div>
          <div className="rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-3">
            <p className="text-xs uppercase text-[#6c6f6e]">Sudah ditandatangani</p>
            <p className="text-xl font-semibold text-[#1E453E]">{signed}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
