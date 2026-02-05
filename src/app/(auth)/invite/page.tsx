import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/crypto";
import { InviteForm } from "./InviteForm";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <Card>
        <p className="text-sm text-red-600">Token undangan tidak ditemukan.</p>
      </Card>
    );
  }

  const invite = await prisma.invitation.findFirst({
    where: {
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!invite) {
    return (
      <Card>
        <p className="text-sm text-red-600">
          Undangan tidak valid atau sudah kedaluwarsa.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1E453E]">
          Aktivasi akun karyawan
        </h2>
        <p className="text-sm text-[#6c6f6e]">
          Lengkapi data untuk mulai menggunakan portal.
        </p>
      </div>
      <InviteForm token={token} email={invite.email} name={invite.name} />
    </Card>
  );
}
