import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1E453E]">
          Atur ulang kata sandi
        </h2>
        <p className="text-sm text-[#6c6f6e]">
          Gunakan tautan yang Anda terima untuk mengganti kata sandi.
        </p>
      </div>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-red-600">Token tidak ditemukan.</p>
      )}
    </Card>
  );
}
