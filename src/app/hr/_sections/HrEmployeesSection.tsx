import { Card } from "@/components/ui/card";
import { CreateEmployeeForm } from "../CreateEmployeeForm";
import { EmployeeList } from "../EmployeeList";
import { InviteEmployeeForm } from "../InviteEmployeeForm";
import type { HrEmployee } from "./types";

type HrEmployeesSectionProps = {
  employees: HrEmployee[];
};

export function HrEmployeesSection({ employees }: HrEmployeesSectionProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-[#1E453E]">Undang Karyawan</h2>
          <p className="text-sm text-[#6c6f6e]">Kirim undangan untuk aktivasi akun karyawan.</p>
          <div className="mt-4">
            <InviteEmployeeForm />
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-[#1E453E]">Buat Akun Manual</h2>
          <p className="text-sm text-[#6c6f6e]">
            Buat akun tanpa email. Login menggunakan username dan kata sandi.
          </p>
          <div className="mt-4">
            <CreateEmployeeForm />
          </div>
        </Card>
      </div>
      <Card>
        <h2 className="text-lg font-semibold text-[#1E453E]">Daftar Karyawan</h2>
        <p className="text-sm text-[#6c6f6e]">Klik tombol detail untuk melihat profil dan dokumen karyawan.</p>
        <div className="mt-4">
          <EmployeeList employees={employees} />
        </div>
      </Card>
    </div>
  );
}
