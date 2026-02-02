import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default async function ReportsPage() {
  await requireRole(UserRole.HR);
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
