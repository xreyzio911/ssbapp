import Image from "next/image";
import { RoleNav } from "@/components/nav/RoleNav";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/lib/enums";

export default async function HrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(UserRole.HR);

  return (
    <div className="min-h-screen px-4 py-6">
      <header className="sticky top-4 z-40 mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-3xl border border-white/60 bg-white/70 px-6 py-5 shadow-[0_12px_40px_rgba(30,69,62,0.12)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <Image
              src="/sisabe-logo.png"
              alt="Sisabe"
              width={60}
              height={60}
              className="h-[60px] w-[60px] rounded-2xl border border-white/60 bg-white/70 p-2 shadow-[0_8px_24px_rgba(30,69,62,0.12)]"
              priority
            />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-[#1E453E]/60">Dashboard HR</p>
              <h1 className="text-2xl font-semibold text-[#1E453E]">{user.name}</h1>
            </div>
          </div>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="text-sm text-[#1E453E] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring-focus)]"
            >
              Keluar
            </button>
          </form>
        </div>
        <RoleNav
          items={[
            { href: "/hr", label: "Karyawan", match: "prefix" },
            { href: "/hr/batch-upload", label: "Unggah Batch", match: "exact" },
            { href: "/hr/reports", label: "Laporan", match: "exact" },
            { href: "/hr/audit", label: "Audit Log", match: "exact" },
          ]}
        />
      </header>
      <main className="mx-auto mt-6 w-full max-w-6xl">{children}</main>
    </div>
  );
}
