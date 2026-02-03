"use client";

import { useRoleTabs } from "@/components/nav/RoleTabs";
import { Card } from "@/components/ui/card";
import { InviteEmployeeForm } from "./InviteEmployeeForm";
import { EmployeeList } from "./EmployeeList";
import { BatchUploadForm } from "./batch-upload/BatchUploadForm";
import Link from "next/link";

type Employee = {
  id: string;
  name: string;
  email: string;
};

type AuditLog = {
  id: string;
  action: string;
  createdAt: string;
  actorName: string | null;
};

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

export function HrTabsContent({
  employees,
  logs,
}: {
  employees: Employee[];
  logs: AuditLog[];
}) {
  const { activeId } = useRoleTabs();

  if (activeId === "batch") {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">
          Unggah Dokumen Batch
        </h2>
        <p className="text-sm text-[#6c6f6e]">
          Upload sekali dan pilih banyak karyawan sekaligus.
        </p>
        <div className="mt-4">
          <BatchUploadForm employees={employees} />
        </div>
      </Card>
    );
  }

  if (activeId === "reports") {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">Laporan</h2>
        <p className="text-sm text-[#6c6f6e]">
          Unduh laporan sederhana untuk dokumen yang belum lengkap.
        </p>
        <div className="mt-4">
          <Link
            className="rounded-full bg-[#1E453E] px-4 py-2 text-sm font-medium text-white"
            href="/api/hr/reports/missing-docs"
          >
            Export CSV Dokumen Belum Lengkap
          </Link>
        </div>
      </Card>
    );
  }

  if (activeId === "audit") {
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
                  {log.actorName ?? "Sistem"} Â·{" "}
                  {new Date(log.createdAt).toLocaleString("id-ID")}
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

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">
          Undang Karyawan
        </h2>
        <p className="text-sm text-[#6c6f6e]">
          Kirim undangan untuk aktivasi akun karyawan.
        </p>
        <div className="mt-4">
          <InviteEmployeeForm />
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">
          Daftar Karyawan
        </h2>
        <div className="mt-4">
          <EmployeeList employees={employees} />
        </div>
      </Card>
    </div>
  );
}
