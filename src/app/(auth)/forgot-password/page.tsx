import { Card } from "@/components/ui/card";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1E453E]">
          Lupa kata sandi
        </h2>
        <p className="text-sm text-[#6c6f6e]">
          Masukkan email untuk menerima tautan pengaturan ulang.
        </p>
      </div>
      <ForgotPasswordForm />
    </Card>
  );
}
