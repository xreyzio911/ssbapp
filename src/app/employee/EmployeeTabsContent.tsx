"use client";

import { useRoleTabs } from "@/components/nav/RoleTabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DOC_TYPES } from "@/lib/constants";
import { DocumentUploadCard } from "./documents/DocumentUploadCard";
import { HrFileCard } from "./hr-files/HrFileCard";
import { EmployeeProfileForm } from "./profile/EmployeeProfileForm";
import { EmptyState } from "@/components/ui/empty-state";

type UserProfile = {
  email: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  dob?: string | null;
  nik?: string | null;
  hasSignature: boolean;
  signatureUpdatedAt?: string | null;
};

type Version = {
  docType: string;
  createdAt: string;
};

type Status = {
  docType: string;
  needsUpdate: boolean;
};

type Assignment = {
  id: string;
  status: "PENDING" | "SIGNED";
  assignedAt: string;
  signedAt: string | null;
  hrFile: {
    fileType: "GENERAL" | "AGREEMENT";
    title: string;
    mimeType: string;
    size: number;
  };
};

export function EmployeeTabsContent({
  user,
  versions,
  statuses,
  assignments,
}: {
  user: UserProfile;
  versions: Version[];
  statuses: Status[];
  assignments: Assignment[];
}) {
  const { activeId } = useRoleTabs();

  const latestByType = new Map<string, string>();
  versions.forEach((version) => {
    if (!latestByType.has(version.docType)) {
      latestByType.set(version.docType, version.createdAt);
    }
  });

  const statusByType = new Map<string, boolean>();
  statuses.forEach((status) => {
    statusByType.set(status.docType, status.needsUpdate);
  });

  if (activeId === "documents") {
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
                lastUploaded={
                  latest ? new Date(latest).toLocaleDateString("id-ID") : undefined
                }
              />
            );
          })}
        </div>
      </Card>
    );
  }

  if (activeId === "hr-files") {
    return (
      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#1E453E]">
            Dokumen dari HR
          </h2>
          <p className="text-sm text-[#6c6f6e]">
            Dokumen dapat dibuka langsung setelah login.
          </p>
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
                hasSignature={user.hasSignature}
                signerName={user.name}
              />
            ))}
          </div>
        )}
      </Card>
    );
  }

  if (activeId === "profile") {
    return (
      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#1E453E]">Profil Saya</h2>
          <p className="text-sm text-[#6c6f6e]">
            Pastikan data Anda selalu terbaru.
          </p>
        </div>
        <EmployeeProfileForm
          email={user.email}
          name={user.name}
          phone={user.phone}
          address={user.address}
          dob={user.dob ?? null}
          nik={user.nik}
          hasSignature={user.hasSignature}
          signatureUpdatedAt={user.signatureUpdatedAt ?? null}
        />
      </Card>
    );
  }

  const pending = assignments.filter((a) => a.status === "PENDING").length;
  const signed = assignments.filter((a) => a.status === "SIGNED").length;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">Ringkasan Dokumen</h2>
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
                      ? `Terakhir: ${new Date(latest).toLocaleDateString("id-ID")}`
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
            <p className="text-xs uppercase text-[#6c6f6e]">
              Sudah ditandatangani
            </p>
            <p className="text-xl font-semibold text-[#1E453E]">{signed}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
