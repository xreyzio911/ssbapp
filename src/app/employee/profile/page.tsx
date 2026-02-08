import { requireRole } from "@/lib/auth";
import { UserRole } from "@/lib/enums";
import { EmployeeProfileSection } from "../_sections/EmployeeProfileSection";

export default async function EmployeeProfilePage() {
  const user = await requireRole(UserRole.EMPLOYEE);

  const safeUser = {
    email: user.email,
    name: user.name,
    username: user.username,
    position: user.position,
    workLocation: user.workLocation,
    phone: user.phone,
    address: user.address,
    dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
    nik: user.nik,
    hasSignature: Boolean(user.signaturePath),
    signatureUpdatedAt: user.signatureUpdatedAt
      ? user.signatureUpdatedAt.toISOString()
      : null,
  };

  return <EmployeeProfileSection user={safeUser} />;
}

