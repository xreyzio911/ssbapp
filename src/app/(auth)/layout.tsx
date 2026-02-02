import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#1E453E]/60">
            Portal Manpower
          </p>
          <h1 className="text-3xl font-semibold text-[#1E453E]">
            Kelola dokumen karyawan dengan rapi
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
