import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1E453E]">Masuk</h2>
        <p className="text-sm text-[#6c6f6e]">
          Gunakan akun HR atau karyawan untuk mengakses portal.
        </p>
      </div>
      <LoginForm />
      <div className="mt-4 text-center text-sm">
        <Link className="text-[#1E453E] underline" href="/forgot-password">
          Lupa kata sandi?
        </Link>
      </div>
    </Card>
  );
}
