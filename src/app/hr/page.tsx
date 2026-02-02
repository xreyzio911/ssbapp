import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { Card } from "@/components/ui/card";
import { InviteEmployeeForm } from "./InviteEmployeeForm";
import { EmployeeList } from "./EmployeeList";

export default async function HrDashboard() {
  await requireRole(UserRole.HR);

  const employees = await prisma.user.findMany({
    where: { role: UserRole.EMPLOYEE },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

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

