import { Card } from "@/components/ui/card";
import { EmployeeProfileForm } from "../profile/EmployeeProfileForm";
import type { EmployeeProfileData } from "./types";

type EmployeeProfileSectionProps = {
  user: EmployeeProfileData;
};

export function EmployeeProfileSection({ user }: EmployeeProfileSectionProps) {
  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#1E453E]">Profil Saya</h2>
        <p className="text-sm text-[#6c6f6e]">Pastikan data Anda selalu terbaru.</p>
      </div>
      <EmployeeProfileForm
        email={user.email}
        name={user.name}
        username={user.username}
        position={user.position}
        workLocation={user.workLocation}
        phone={user.phone}
        address={user.address}
        dob={user.dob ?? null}
        nik={user.nik}
        hasSignature={user.hasSignature}
        signatureUpdatedAt={user.signatureUpdatedAt ?? null}
      />
    </Card>
  );
}
