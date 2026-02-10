import type { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6 flex items-start gap-5">
          <Image
            src="/sisabe-logo.png"
            alt="Sisabe"
            width={73}
            height={73}
            className="h-[73px] w-[73px] rounded-2xl border border-white/60 bg-white/70 p-[10px] shadow-[0_8px_24px_rgba(30,69,62,0.12)]"
            priority
          />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#1E453E]/60">
              Portal Manpower
            </p>
            <h1 className="text-3xl font-semibold text-[#1E453E]">
              Kelola dokumen karyawan dengan rapi
            </h1>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
