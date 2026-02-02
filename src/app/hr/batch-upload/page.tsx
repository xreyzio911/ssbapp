import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { BatchUploadForm } from "./BatchUploadForm";

export default async function BatchUploadPage() {
  await requireRole(UserRole.HR);
  const employees = await prisma.user.findMany({
    where: { role: UserRole.EMPLOYEE },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

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
