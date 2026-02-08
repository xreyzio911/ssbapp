import { Card } from "@/components/ui/card";
import { BatchUploadForm } from "../batch-upload/BatchUploadForm";
import type { HrEmployee } from "./types";

type HrBatchUploadSectionProps = {
  employees: HrEmployee[];
};

export function HrBatchUploadSection({ employees }: HrBatchUploadSectionProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-[#1E453E]">Unggah Dokumen Batch</h2>
      <p className="text-sm text-[#6c6f6e]">Unggah sekali dan pilih banyak karyawan sekaligus.</p>
      <div className="mt-4">
        <BatchUploadForm employees={employees} />
      </div>
    </Card>
  );
}
