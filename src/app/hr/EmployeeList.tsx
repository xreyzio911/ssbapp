"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

type Employee = {
  id: string;
  name: string;
  email: string;
};

export function EmployeeList({ employees }: { employees: Employee[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q)
    );
  }, [query, employees]);

  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="Cari nama atau email"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((employee) => (
          <Link
            key={employee.id}
            href={`/hr/employees/${employee.id}`}
            className="rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-3 transition hover:shadow-sm"
          >
            <p className="text-sm font-semibold text-[#1E453E]">
              {employee.name}
            </p>
            <p className="text-xs text-[#6c6f6e]">{employee.email}</p>
          </Link>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-[#6c6f6e]">Tidak ada karyawan ditemukan.</p>
      ) : null}
    </div>
  );
}
