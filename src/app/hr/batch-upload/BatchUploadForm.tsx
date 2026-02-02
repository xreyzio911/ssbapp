"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Employee = {
  id: string;
  name: string;
  email: string;
};

export function BatchUploadForm({ employees }: { employees: Employee[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [fileType, setFileType] = useState<"GENERAL" | "AGREEMENT">("GENERAL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q)
    );
  }, [employees, query]);

  function toggleEmployee(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[name="file"]');
    const file = fileInput?.files?.[0];
    if (!file) {
      setMessage("File belum dipilih.");
      return;
    }
    if (selected.length === 0) {
      setMessage("Pilih minimal satu karyawan.");
      return;
    }
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("fileType", fileType);
    formData.append("title", title || file.name);
    formData.append("employeeIds", JSON.stringify(selected));
    formData.append("file", file);

    const res = await fetch("/api/hr/files/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Gagal mengunggah.");
    } else {
      setMessage("File berhasil diunggah dan dikirim.");
      setSelected([]);
      setTitle("");
      form.reset();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">
            Judul dokumen
          </label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">
            Jenis
          </label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value as "GENERAL" | "AGREEMENT")}
            className="w-full rounded-2xl border border-[#1E453E]/15 bg-white px-4 py-2 text-sm"
          >
            <option value="GENERAL">Dokumen HR</option>
            <option value="AGREEMENT">Perjanjian (PDF)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          File
        </label>
        <Input name="file" type="file" accept="application/pdf,image/jpeg,image/png" />
        <p className="mt-1 text-xs text-[#6c6f6e]">
          Perjanjian wajib PDF.
        </p>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Pilih karyawan
        </label>
        <Input
          placeholder="Cari karyawan"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-3 max-h-56 space-y-2 overflow-auto rounded-2xl border border-[#1E453E]/10 bg-white p-3">
          {filtered.map((emp) => (
            <label key={emp.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(emp.id)}
                onChange={() => toggleEmployee(emp.id)}
              />
              <span>
                {emp.name} · {emp.email}
              </span>
            </label>
          ))}
          {filtered.length === 0 ? (
            <p className="text-xs text-[#6c6f6e]">Tidak ada karyawan.</p>
          ) : null}
        </div>
      </div>
      {message ? <p className="text-sm text-[#1E453E]">{message}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Mengunggah..." : "Kirim ke karyawan"}
      </Button>
    </form>
  );
}
