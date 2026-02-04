import { requireRole } from "@/lib/auth";
import { UserRole } from "@/lib/enums";
import { RoleTabsNav, RoleTabsProvider } from "@/components/nav/RoleTabs";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(UserRole.EMPLOYEE);

  return (
    <RoleTabsProvider
      items={[
        { id: "beranda", label: "Beranda" },
        { id: "documents", label: "Unggah Dokumen" },
        { id: "hr-files", label: "Dokumen dari HR" },
        { id: "profile", label: "Profil" },
      ]}
      defaultId="beranda"
      basePath="/employee"
    >
      <div className="min-h-screen px-4 py-6">
        <header className="sticky top-4 z-40 mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-3xl border border-white/60 bg-white/85 px-6 py-5 shadow-[0_12px_40px_rgba(30,69,62,0.12)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#1E453E]/60">
                Portal Karyawan
              </p>
              <h1 className="text-2xl font-semibold text-[#1E453E]">
                Halo, {user.name}
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
        <main className="mx-auto mt-6 w-full max-w-5xl">{children}</main>
      </div>
    </RoleTabsProvider>
  );
}

