"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { InlineNotice } from "@/components/ui/inline-notice";

type Employee = {
  id: string;
  name: string;
  email: string | null;
  username: string;
  position?: string | null;
  workLocation?: string | null;
};

type NoticeTone = "success" | "error" | "info";

export function EmployeeList({ employees }: { employees: Employee[] }) {
  const [query, setQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"NAME_ASC" | "NAME_DESC" | "POSITION" | "LOCATION">(
    "NAME_ASC"
  );
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
  const [copyNotice, setCopyNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const dialogTitleId = "detail-cepat-title";
  const canUseDom = typeof window !== "undefined" && typeof document !== "undefined";
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const positions = useMemo(() => {
    const unique = new Set<string>();
    employees.forEach((employee) => {
      if (employee.position) {
        unique.add(employee.position);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "id"));
  }, [employees]);

  const locations = useMemo(() => {
    const unique = new Set<string>();
    employees.forEach((employee) => {
      if (employee.workLocation) {
        unique.add(employee.workLocation);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "id"));
  }, [employees]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = employees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(q) ||
        employee.username.toLowerCase().includes(q) ||
        (employee.email ? employee.email.toLowerCase().includes(q) : false)
    );

    if (positionFilter !== "ALL") {
      list = list.filter((employee) => employee.position === positionFilter);
    }

    if (locationFilter !== "ALL") {
      list = list.filter((employee) => employee.workLocation === locationFilter);
    }

    const byName = (a: Employee, b: Employee) =>
      a.name.localeCompare(b.name, "id", { sensitivity: "base" });
    const byPosition = (a: Employee, b: Employee) => {
      const ap = a.position || "zzzz";
      const bp = b.position || "zzzz";
      const cmp = ap.localeCompare(bp, "id", { sensitivity: "base" });
      return cmp !== 0 ? cmp : byName(a, b);
    };
    const byLocation = (a: Employee, b: Employee) => {
      const al = a.workLocation || "zzzz";
      const bl = b.workLocation || "zzzz";
      const cmp = al.localeCompare(bl, "id", { sensitivity: "base" });
      return cmp !== 0 ? cmp : byName(a, b);
    };

    const sorted = [...list];
    if (sortBy === "NAME_ASC") {
      sorted.sort(byName);
    } else if (sortBy === "NAME_DESC") {
      sorted.sort((a, b) => byName(b, a));
    } else if (sortBy === "POSITION") {
      sorted.sort(byPosition);
    } else if (sortBy === "LOCATION") {
      sorted.sort(byLocation);
    }

    return sorted;
  }, [employees, locationFilter, positionFilter, query, sortBy]);

  useEffect(() => {
    if (!activeEmployee) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setActiveEmployee(null);
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );

        if (focusable.length === 0) {
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", onKeyDown);
      lastFocusRef.current?.focus();
    };
  }, [activeEmployee]);

  async function handleCopyEmail(email: string | null) {
    if (!email) {
      setCopyNotice({ tone: "info", message: "Email belum tersedia." });
      setTimeout(() => setCopyNotice(null), 1500);
      return;
    }

    if (!navigator.clipboard) {
      setCopyNotice({ tone: "error", message: "Fitur salin tidak tersedia." });
      setTimeout(() => setCopyNotice(null), 1500);
      return;
    }

    try {
      await navigator.clipboard.writeText(email);
      setCopyNotice({ tone: "success", message: "Email disalin." });
    } catch {
      setCopyNotice({ tone: "error", message: "Gagal menyalin email." });
    }

    setTimeout(() => setCopyNotice(null), 1500);
  }

  function closeDialog() {
    setActiveEmployee(null);
    setCopyNotice(null);
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="employee-search" className="mb-1 block text-xs text-[#6c6f6e]">
              Cari karyawan
            </label>
            <Input
              id="employee-search"
              placeholder="Cari nama, username, atau email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-5 rounded-full border border-[#1E453E]/15 px-4 py-2 text-xs font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
            >
              Bersihkan
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label htmlFor="employee-filter-position" className="mb-1 block text-xs text-[#6c6f6e]">
              Filter jabatan
            </label>
            <Select
              id="employee-filter-position"
              value={positionFilter}
              onChange={(event) => setPositionFilter(event.target.value)}
            >
              <option value="ALL">Semua jabatan</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="employee-filter-location" className="mb-1 block text-xs text-[#6c6f6e]">
              Filter lokasi
            </label>
            <Select
              id="employee-filter-location"
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
            >
              <option value="ALL">Semua lokasi</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="employee-sort" className="mb-1 block text-xs text-[#6c6f6e]">
              Urutkan
            </label>
            <Select
              id="employee-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            >
              <option value="NAME_ASC">Nama (A-Z)</option>
              <option value="NAME_DESC">Nama (Z-A)</option>
              <option value="POSITION">Jabatan</option>
              <option value="LOCATION">Lokasi kerja</option>
            </Select>
          </div>
        </div>

        <div className="text-xs text-[#6c6f6e]">
          Menampilkan {filtered.length} dari {employees.length} karyawan
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((employee) => (
            <div
              key={employee.id}
              className="grid gap-3 rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(30,69,62,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(30,69,62,0.12)] md:grid-cols-[1fr_auto] md:items-start"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1E453E]">{employee.name}</p>
                <p className="text-xs text-[#6c6f6e]">{employee.email ?? "Tanpa email"}</p>
                <p className="text-xs text-[#6c6f6e]">
                  {employee.position ?? "Belum ada jabatan"} - {employee.workLocation ?? "Belum ada lokasi"}
                </p>
                <p className="text-xs text-[#6c6f6e]">Username: {employee.username}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:justify-end md:self-start">
                <button
                  type="button"
                  onClick={(event) => {
                    lastFocusRef.current = event.currentTarget;
                    setCopyNotice(null);
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
      </div>

      {activeEmployee ? (
        canUseDom
          ? createPortal(
              <div className="fixed inset-0 z-[70]">
                <button
                  type="button"
                  aria-label="Tutup detail cepat"
                  className="absolute inset-0 bg-black/18 backdrop-blur-[2px]"
                  onClick={closeDialog}
                />

                <div className="absolute inset-0 grid place-items-center p-4 sm:p-6">
                  <div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={dialogTitleId}
                    className="relative w-full max-w-[520px] overflow-y-auto rounded-3xl border border-white/70 bg-[#f7f7f2] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)]"
                    style={{ maxHeight: "90vh" }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[#1E453E]/60">Detail Cepat</p>
                        <h3 id={dialogTitleId} className="mt-2 text-2xl font-semibold text-[#1E453E]">
                          {activeEmployee.name}
                        </h3>
                        <p className="text-sm text-[#6c6f6e]">{activeEmployee.email ?? "Tanpa email"}</p>
                        <p className="text-xs text-[#6c6f6e]">Username: {activeEmployee.username}</p>
                      </div>
                      <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={closeDialog}
                        className="rounded-full border border-[#1E453E]/20 px-4 py-1 text-xs font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
                      >
                        Tutup
                      </button>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="rounded-2xl border border-[#1E453E]/10 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#6c6f6e]">Informasi Kontak</p>
                        <div className="mt-3 space-y-2 text-sm text-[#1E453E]">
                          <p>{activeEmployee.email ?? "Tanpa email"}</p>
                          {copyNotice ? <InlineNotice tone={copyNotice.tone} message={copyNotice.message} /> : null}
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
                        <p className="text-xs uppercase tracking-[0.2em] text-[#6c6f6e]">Aksi Cepat</p>
                        <div className="mt-4 grid gap-2">
                          <Link
                            href={`/hr/employees/${activeEmployee.id}`}
                            className="rounded-2xl border border-[#1E453E]/10 px-4 py-3 text-sm font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
                            onClick={closeDialog}
                          >
                            Buka profil lengkap
                          </Link>
                          <Link
                            href={`/hr/employees/${activeEmployee.id}#dokumen-pribadi`}
                            className="rounded-2xl border border-[#1E453E]/10 px-4 py-3 text-sm font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
                            onClick={closeDialog}
                          >
                            Lihat dokumen pribadi
                          </Link>
                          <Link
                            href={`/hr/employees/${activeEmployee.id}#dokumen-hr`}
                            className="rounded-2xl border border-[#1E453E]/10 px-4 py-3 text-sm font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
                            onClick={closeDialog}
                          >
                            Lihat dokumen HR
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )
          : null
      ) : null}
    </>
  );
}
