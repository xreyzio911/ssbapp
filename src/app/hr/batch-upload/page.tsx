import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { HrBatchUploadSection } from "../_sections/HrBatchUploadSection";

export default async function BatchUploadPage() {
  await requireRole(UserRole.HR);

  const employees = await prisma.user.findMany({
    where: { role: UserRole.EMPLOYEE },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      position: true,
      workLocation: true,
    },
  });

  return <HrBatchUploadSection employees={employees} />;
}

