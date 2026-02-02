import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { EmployeeProfileForm } from "./EmployeeProfileForm";

export default async function EmployeeProfilePage() {
  const user = await requireRole(UserRole.EMPLOYEE);

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
        dob={user.dob ? user.dob.toISOString().slice(0, 10) : null}
        nik={user.nik}
      />
    </Card>
  );
}
