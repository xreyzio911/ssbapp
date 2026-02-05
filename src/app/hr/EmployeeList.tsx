"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { createPortal } from "react-dom";

type Employee = {
  id: string;
  name: string;
  email: string | null;
  username: string;
};

export function EmployeeList({ employees }: { employees: Employee[] }) {
  const [query, setQuery] = useState("");
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const dialogTitleId = "detail-cepat-title";
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.username.toLowerCase().includes(q) ||
        (emp.email ? emp.email.toLowerCase().includes(q) : false)
    );
  }, [query, employees]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!activeEmployee) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveEmployee(null);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [activeEmployee]);

  async function handleCopyEmail(email: string | null) {
    if (!email) {
      setCopyStatus("Email belum tersedia.");
      setTimeout(() => setCopyStatus(null), 1500);
      return;
    }
    if (!navigator.clipboard) {
      setCopyStatus("Fitur salin tidak tersedia.");
      setTimeout(() => setCopyStatus(null), 1500);
      return;
    }
    try {
      await navigator.clipboard.writeText(email);
      setCopyStatus("Email disalin.");
    } catch {
      setCopyStatus("Gagal menyalin email.");
    }
    setTimeout(() => setCopyStatus(null), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Cari nama, username, atau email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-full border border-[#1E453E]/15 px-4 py-2 text-xs font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
          >
            Bersihkan
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6c6f6e]">
        <span>
          Menampilkan {filtered.length} dari {employees.length} karyawan
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((employee) => (
          <div
            key={employee.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(30,69,62,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(30,69,62,0.12)]"
          >
            <div>
              <p className="text-sm font-semibold text-[#1E453E]">
                {employee.name}
              </p>
              <p className="text-xs text-[#6c6f6e]">
                {employee.email ?? "Tanpa email"}
              </p>
              <p className="text-xs text-[#6c6f6e]">
                Username: {employee.username}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCopyStatus(null);
                  setActiveEmployee(employee);
                }}
                className="inline-flex items-center justify-center rounded-full border border-[#1E453E]/20 bg-white px-4 py-2 text-xs font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
              >
                Detail cepat
              </button>
              <Link
                href={`/hr/employees/${employee.id}`}
                className="inline-flex items-center justify-center rounded-full bg-[#1E453E] px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-[#173730]"
              >
                Buka profil
              </Link>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada karyawan ditemukan"
          description="Coba kata kunci lain atau undang karyawan baru."
        />
      ) : null}
      {mounted && activeEmployee
        ? createPortal(
            <div className="fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"
                onClick={() => setActiveEmployee(null)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                className="absolute left-1/2 top-1/2 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/70 bg-[#f7f7f2] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)]"
                style={{ maxHeight: "90vh" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#1E453E]/60">
                      Detail Cepat
                    </p>
                    <h3
                      id={dialogTitleId}
                      className="mt-2 text-2xl font-semibold text-[#1E453E]"
                    >
                      {activeEmployee.name}
                    </h3>
                    <p className="text-sm text-[#6c6f6e]">
                      {activeEmployee.email ?? "Tanpa email"}
                    </p>
                    <p className="text-xs text-[#6c6f6e]">
                      Username: {activeEmployee.username}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveEmployee(null)}
                    className="rounded-full border border-[#1E453E]/20 px-4 py-1 text-xs font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
                  >
                    Tutup
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-[#1E453E]/10 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#6c6f6e]">
                      Informasi Kontak
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-[#1E453E]">
                      <p>{activeEmployee.email ?? "Tanpa email"}</p>
                      {copyStatus ? (
                        <p className="text-xs text-[#6c6f6e]">{copyStatus}</p>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(activeEmployee.email)}
                        className="rounded-full border border-[#1E453E]/20 px-4 py-2 text-xs font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
                      >
                        Salin email
                      </button>
                      {activeEmployee.email ? (
                        <a
                          href={`mailto:${activeEmployee.email}`}
                          className="rounded-full border border-[#1E453E]/20 px-4 py-2 text-xs font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
                        >
                          Kirim email
                        </a>
                      ) : (
                        <span className="rounded-full border border-[#1E453E]/10 px-4 py-2 text-xs font-medium text-[#6c6f6e]">
                          Email tidak tersedia
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1E453E]/10 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#6c6f6e]">
                      Aksi Cepat
                    </p>
                    <div className="mt-4 grid gap-2">
                      <Link
                        href={`/hr/employees/${activeEmployee.id}`}
                        className="rounded-2xl border border-[#1E453E]/10 px-4 py-3 text-sm font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
                      >
                        Buka profil lengkap
                      </Link>
                      <Link
                        href={`/hr/employees/${activeEmployee.id}#dokumen-pribadi`}
                        className="rounded-2xl border border-[#1E453E]/10 px-4 py-3 text-sm font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
                      >
                        Lihat dokumen pribadi
                      </Link>
                      <Link
                        href={`/hr/employees/${activeEmployee.id}#dokumen-hr`}
                        className="rounded-2xl border border-[#1E453E]/10 px-4 py-3 text-sm font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
                      >
                        Lihat dokumen HR
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
