import Link from "next/link";
import { Card } from "@/components/ui/card";

export function HrReportsSection() {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-[#1E453E]">Laporan</h2>
      <p className="text-sm text-[#6c6f6e]">
        Unduh laporan sederhana untuk dokumen yang belum lengkap.
      </p>
      <div className="mt-4">
        <Link
          className="inline-flex rounded-full bg-[#1E453E] px-4 py-2 text-sm font-medium text-white"
          href="/api/hr/reports/missing-docs"
        >
          Ekspor CSV Dokumen Belum Lengkap
        </Link>
      </div>
    </Card>
  );
}
