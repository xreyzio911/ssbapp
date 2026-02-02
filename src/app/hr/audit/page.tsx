import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { Card } from "@/components/ui/card";

export default async function AuditPage() {
  await requireRole(UserRole.HR);
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: true },
  });

  const actionLabels: Record<string, string> = {
    UPLOAD_EMPLOYEE_DOC: "Unggah dokumen karyawan",
    UPLOAD_HR_FILE: "Unggah dokumen HR",
    DOWNLOAD_HR_FILE_ENC: "Unduh dokumen HR (terenkripsi)",
    DOWNLOAD_HR_FILE: "Unduh dokumen HR",
    DOWNLOAD_HR_SIGNED: "Unduh dokumen signed",
    DOWNLOAD_EMPLOYEE_DOC: "Unduh dokumen karyawan",
    SIGN_AGREEMENT: "Tanda tangan perjanjian",
    PASSWORD_REISSUE: "Kirim ulang kata sandi dokumen",
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-[#1E453E]">Audit Log</h2>
      <p className="text-sm text-[#6c6f6e]">
        Aktivitas terbaru (100 entri terakhir).
      </p>
      <div className="mt-4 space-y-2 text-sm">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-3"
          >
            <div>
              <p className="font-medium text-[#1E453E]">
                {actionLabels[log.action] ?? log.action}
              </p>
              <p className="text-xs text-[#6c6f6e]">
                {log.actor?.name ?? "Sistem"} ·{" "}
                {log.createdAt.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        ))}
        {logs.length === 0 ? (
          <p className="text-sm text-[#6c6f6e]">Belum ada aktivitas.</p>
        ) : null}
      </div>
    </Card>
  );
}

