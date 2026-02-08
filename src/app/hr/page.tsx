import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { HrEmployeesSection } from "./_sections/HrEmployeesSection";

export default async function HrDashboardPage() {
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

  return <HrEmployeesSection employees={employees} />;
}

