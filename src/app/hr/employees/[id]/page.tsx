import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DOC_TYPES, DOC_TYPE_LABELS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { EmployeeProfileEditor } from "./EmployeeProfileEditor";
import { DocStatusToggle } from "./DocStatusToggle";
import { UserRole } from "@/lib/enums";
import Link from "next/link";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(UserRole.HR);
  const { id } = await params;
  const employee = await prisma.user.findUnique({
    where: { id },
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

  const totalDocTypes = DOC_TYPES.length;
  const uploadedDocTypes = DOC_TYPES.filter(
    (doc) => versionsByType[doc.type].length > 0
  ).length;
  const needsUpdateCount = statuses.filter(
    (s: { needsUpdate: boolean }) => s.needsUpdate
  ).length;
  const missingCount = totalDocTypes - uploadedDocTypes;
  const hrPending = assignments.filter(
    (assignment: { status: string }) => assignment.status === "PENDING"
  ).length;
  const hrSigned = assignments.filter(
    (assignment: { status: string }) => assignment.status === "SIGNED"
  ).length;
  const lastDocUpload = versions[0]?.createdAt;
  const lastHrAssign = assignments[0]?.assignedAt;
  const lastActivity =
    lastDocUpload && lastHrAssign
      ? lastDocUpload > lastHrAssign
        ? lastDocUpload
        : lastHrAssign
      : lastDocUpload || lastHrAssign;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm text-[#1E453E] underline" href="/hr#karyawan">
          Kembali ke daftar karyawan
        </Link>
        <div className="text-sm text-[#6c6f6e]">{employee.email}</div>
      </div>
      <div className="reveal rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(30,69,62,0.12)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#1E453E]/50">
              Profil Karyawan
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1E453E]">
              {employee.name}
            </h1>
            <p className="text-sm text-[#6c6f6e]">{employee.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#6c6f6e]">
              <span>
                Aktivitas terakhir:{" "}
                {lastActivity
                  ? lastActivity.toLocaleString("id-ID")
                  : "Belum ada aktivitas"}
              </span>
              <span>·</span>
              <span>
                Bergabung: {employee.createdAt.toLocaleDateString("id-ID")}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[#1E453E]/15 bg-white px-4 py-2 text-xs font-medium text-[#1E453E]">
              Dokumen: {uploadedDocTypes}/{totalDocTypes}
            </span>
            <span className="rounded-full border border-[#D4AF37]/40 bg-[#fff7e1] px-4 py-2 text-xs font-medium text-[#1E453E]">
              Perlu pembaruan: {needsUpdateCount}
            </span>
            <span className="rounded-full border border-[#1E453E]/15 bg-white px-4 py-2 text-xs font-medium text-[#1E453E]">
              HR: {hrPending} menunggu · {hrSigned} selesai
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3 stagger">
          <div className="rounded-2xl border border-[#1E453E]/10 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6c6f6e]">
              Dokumen Pribadi
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#1E453E]">
              {uploadedDocTypes}/{totalDocTypes}
            </p>
            <p className="text-xs text-[#6c6f6e]">Sudah diunggah</p>
          </div>
          <div className="rounded-2xl border border-[#D4AF37]/40 bg-[#fff7e1] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6c6f6e]">
              Perlu Pembaruan
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#1E453E]">
              {needsUpdateCount}
            </p>
            <p className="text-xs text-[#6c6f6e]">
              Menunggu unggah ulang
            </p>
          </div>
          <div className="rounded-2xl border border-[#1E453E]/10 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6c6f6e]">
              Dokumen Belum Ada
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#1E453E]">
              {missingCount}
            </p>
            <p className="text-xs text-[#6c6f6e]">
              Dari {totalDocTypes} kategori
            </p>
          </div>
        </div>
      </div>
      <Card id="aksi-cepat" className="scroll-mt-24">
        <h2 className="text-lg font-semibold text-[#1E453E]">Aksi Cepat</h2>
        <p className="text-sm text-[#6c6f6e]">
          Akses bagian penting profil karyawan lebih cepat.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <a
            href="#profil-karyawan"
            className="rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-3 text-sm font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
          >
            Profil
          </a>
          <a
            href="#dokumen-pribadi"
            className="rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-3 text-sm font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
          >
            Dokumen Pribadi
          </a>
          <a
            href="#dokumen-hr"
            className="rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-3 text-sm font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
          >
            Dokumen HR
          </a>
          <a
            href={`mailto:${employee.email}`}
            className="rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-3 text-sm font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
          >
            Kirim Email
          </a>
        </div>
      </Card>
      <Card>
        <h2
          id="profil-karyawan"
          className="scroll-mt-24 text-lg font-semibold text-[#1E453E]"
        >
          Profil Karyawan
        </h2>
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
        <h2
          id="dokumen-pribadi"
          className="scroll-mt-24 text-lg font-semibold text-[#1E453E]"
        >
          Dokumen Pribadi
        </h2>
        <div className="mt-4 space-y-4 stagger">
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
        <h2
          id="dokumen-hr"
          className="scroll-mt-24 text-lg font-semibold text-[#1E453E]"
        >
          Dokumen dari HR
        </h2>
        {assignments.length === 0 ? (
          <EmptyState
            title="Belum ada dokumen dari HR"
            description="Dokumen baru dari HR akan muncul di sini."
            className="mt-4"
          />
        ) : (
          <div className="mt-4 space-y-4 stagger">
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
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

