import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DOC_TYPES, DOC_TYPE_LABELS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmployeeProfileEditor } from "./EmployeeProfileEditor";
import { DocStatusToggle } from "./DocStatusToggle";
import { ReissuePasswordButton } from "./ReissuePasswordButton";
import { UserRole } from "@/lib/enums";
import Link from "next/link";

export default async function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole(UserRole.HR);
  const employee = await prisma.user.findUnique({
    where: { id: params.id },
  });
  if (!employee) {
    return (
      <Card>
        <p className="text-sm text-red-600">Karyawan tidak ditemukan.</p>
      </Card>
    );
  }

  const [versions, statuses, assignments] = await Promise.all([
    prisma.documentVersion.findMany({
      where: { userId: employee.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.employeeDocStatus.findMany({
      where: { userId: employee.id },
    }),
    prisma.hrFileAssignment.findMany({
      where: { employeeId: employee.id },
      include: { hrFile: true },
      orderBy: { assignedAt: "desc" },
    }),
  ]);

  const statusByType = new Map<string, boolean>();
  statuses.forEach((s: { docType: string; needsUpdate: boolean }) => {
    statusByType.set(s.docType, s.needsUpdate);
  });
  const versionsByType = DOC_TYPES.reduce((acc, doc) => {
    acc[doc.type] = versions.filter(
      (v: { docType: string }) => v.docType === doc.type
    );
    return acc;
  }, {} as Record<string, typeof versions>);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">Profil Karyawan</h2>
        <div className="mt-4">
          <EmployeeProfileEditor
            id={employee.id}
            name={employee.name}
            email={employee.email}
            phone={employee.phone}
            address={employee.address}
            dob={employee.dob ? employee.dob.toISOString().slice(0, 10) : null}
            nik={employee.nik}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">
          Dokumen Pribadi
        </h2>
        <div className="mt-4 space-y-4">
          {DOC_TYPES.map((doc) => {
            const docVersions = versionsByType[doc.type];
            const needsUpdate = statusByType.get(doc.type) || false;
            const latest = docVersions[0];
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
                className="rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1E453E]">
                      {DOC_TYPE_LABELS[doc.type]}
                    </p>
                    <p className="text-xs text-[#6c6f6e]">
                      {latest
                        ? `Terakhir: ${latest.createdAt.toLocaleDateString("id-ID")}`
                        : "Belum ada file"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={tone}>{status}</Badge>
                    <DocStatusToggle
                      employeeId={employee.id}
                      docType={doc.type}
                      needsUpdate={needsUpdate}
                    />
                  </div>
                </div>
                {docVersions.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {docVersions.map(
                      (version: {
                        id: string;
                        originalFilename: string;
                        createdAt: Date;
                      }) => (
                      <div
                        key={version.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6c6f6e]"
                      >
                        <span>
                          {version.originalFilename} ·{" "}
                          {version.createdAt.toLocaleString("id-ID")}
                        </span>
                        <Link
                          className="text-[#1E453E] underline"
                          href={`/api/hr/documents/${version.id}/download`}
                        >
                          Unduh
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">
          Dokumen dari HR
        </h2>
        {assignments.length === 0 ? (
          <p className="mt-3 text-sm text-[#6c6f6e]">
            Belum ada dokumen yang dikirim.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {assignments.map(
              (assignment: {
                id: string;
                status: string;
                assignedAt: Date;
                signedFilePath: string | null;
                hrFile: { title: string; fileType: string };
              }) => (
              <div
                key={assignment.id}
                className="rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1E453E]">
                      {assignment.hrFile.title}
                    </p>
                    <p className="text-xs text-[#6c6f6e]">
                      {assignment.hrFile.fileType === "AGREEMENT"
                        ? "Perjanjian"
                        : "Dokumen HR"}{" "}
                      ·{" "}
                      {assignment.assignedAt.toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <Badge
                    tone={assignment.status === "SIGNED" ? "green" : "yellow"}
                  >
                    {assignment.status === "SIGNED"
                      ? "Sudah ditandatangani"
                      : "Menunggu"}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <Link
                    className="text-[#1E453E] underline"
                    href={`/api/hr/assignments/${assignment.id}/download`}
                  >
                    Unduh file
                  </Link>
                  {assignment.signedFilePath ? (
                    <Link
                      className="text-[#1E453E] underline"
                      href={`/api/hr/assignments/${assignment.id}/download?signed=1`}
                    >
                      Unduh file signed
                    </Link>
                  ) : null}
                </div>
                <div className="mt-3">
                  <ReissuePasswordButton assignmentId={assignment.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

