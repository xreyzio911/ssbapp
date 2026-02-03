import { requireRole } from "@/lib/auth";
import { UserRole } from "@/lib/enums";
import { RoleTabsNav, RoleTabsProvider } from "@/components/nav/RoleTabs";

export default async function HrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(UserRole.HR);

  return (
    <RoleTabsProvider
      items={[
        { id: "karyawan", label: "Karyawan" },
        { id: "batch", label: "Unggah Batch" },
        { id: "reports", label: "Laporan" },
        { id: "audit", label: "Audit Log" },
      ]}
      defaultId="karyawan"
    >
      <div className="min-h-screen px-4 py-6">
        <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-3xl border border-white/60 bg-white/70 px-6 py-5 shadow-[0_12px_40px_rgba(30,69,62,0.12)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#1E453E]/60">
                Dashboard HR
              </p>
              <h1 className="text-2xl font-semibold text-[#1E453E]">
                {user.name}
              </h1>
            </div>
            <form action="/logout" method="post">
              <button type="submit" className="text-sm text-[#1E453E] underline">
                Keluar
              </button>
            </form>
          </div>
          <RoleTabsNav />
        </header>
        <main className="mx-auto mt-6 w-full max-w-6xl">{children}</main>
      </div>
    </RoleTabsProvider>
  );
}

