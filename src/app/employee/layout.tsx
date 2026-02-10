import Image from "next/image";
import { RoleNav } from "@/components/nav/RoleNav";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/lib/enums";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(UserRole.EMPLOYEE);

  return (
    <div className="min-h-screen px-4 py-6">
      <header className="sticky top-4 z-40 mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-3xl border border-white/60 bg-white/70 px-6 py-5 shadow-[0_12px_40px_rgba(30,69,62,0.12)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/sisabe-logo.png"
              alt="Sisabe"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl border border-white/60 bg-white/70 p-1.5 shadow-[0_8px_24px_rgba(30,69,62,0.12)]"
              priority
            />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-[#1E453E]/60">Portal Karyawan</p>
              <h1 className="text-2xl font-semibold text-[#1E453E]">Halo, {user.name}</h1>
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
            { href: "/employee", label: "Beranda", match: "exact" },
            { href: "/employee/documents", label: "Unggah Dokumen", match: "exact" },
            { href: "/employee/hr-files", label: "Dokumen dari HR", match: "exact" },
            { href: "/employee/profile", label: "Profil", match: "exact" },
          ]}
        />
      </header>
      <main className="mx-auto mt-6 w-full max-w-5xl">{children}</main>
    </div>
  );
}
