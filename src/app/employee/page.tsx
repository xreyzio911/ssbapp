import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DOC_TYPES } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@prisma/client";

export default async function EmployeeDashboard() {
  const user = await requireRole(UserRole.EMPLOYEE);

  const [versions, statuses, assignments] = await Promise.all([
    prisma.documentVersion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.employeeDocStatus.findMany({
      where: { userId: user.id },
    }),
    prisma.hrFileAssignment.findMany({
      where: { employeeId: user.id },
    }),
  ]);

  const latestByType = new Map<string, Date>();
  versions.forEach((version) => {
    if (!latestByType.has(version.docType)) {
      latestByType.set(version.docType, version.createdAt);
    }
  });
  const statusByType = new Map(statuses.map((s) => [s.docType, s.needsUpdate]));

  const pending = assignments.filter((a) => a.status === "PENDING").length;
  const signed = assignments.filter((a) => a.status === "SIGNED").length;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">
          Ringkasan Dokumen
        </h2>
        <p className="text-sm text-[#6c6f6e]">
          Pastikan semua dokumen wajib sudah diunggah.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {DOC_TYPES.map((doc) => {
            const latest = latestByType.get(doc.type);
            const needsUpdate = statusByType.get(doc.type);
            const status = latest
              ? needsUpdate
                ? "Perlu pembaruan"
                : "Sudah diunggah"
              : "Belum diunggah";
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
                  <p className="text-sm font-medium text-[#1E453E]">
                    {doc.label}
                  </p>
                  <p className="text-xs text-[#6c6f6e]">
                    {latest
                      ? `Terakhir: ${latest.toLocaleDateString("id-ID")}`
                      : "Belum ada file"}
                  </p>
                </div>
                <Badge tone={tone}>{status}</Badge>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">
          Dokumen dari HR
        </h2>
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
