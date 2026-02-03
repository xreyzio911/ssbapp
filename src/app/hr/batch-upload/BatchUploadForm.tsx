"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Employee = {
  id: string;
  name: string;
  email: string;
};

type UploadMode = "SHARED" | "SPECIFIC";

type SpecificFile = {
  id: string;
  file: File;
  title: string;
  employeeId: string;
};

function stripExtension(name: string) {
  return name.replace(/\.[^/.]+$/, "");
}

export function BatchUploadForm({ employees }: { employees: Employee[] }) {
  const [mode, setMode] = useState<UploadMode>("SHARED");
  const [selected, setSelected] = useState<string[]>([]);
  const [fileType, setFileType] = useState<"GENERAL" | "AGREEMENT">(
    "GENERAL"
  );
  const [title, setTitle] = useState("");
  const [sharedFile, setSharedFile] = useState<File | null>(null);
  const [specificFiles, setSpecificFiles] = useState<SpecificFile[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q)
    );
  }, [employees, query]);

  function handleModeChange(nextMode: UploadMode) {
    setMode(nextMode);
    setSelected([]);
    setTitle("");
    setSharedFile(null);
    setSpecificFiles([]);
    setQuery("");
    setMessage(null);
    setFileInputKey((prev) => prev + 1);
  }

  function toggleEmployee(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleSharedFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setSharedFile(file);
  }

  function handleSpecificFilesChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);
    const mapped = files.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      file,
      title: stripExtension(file.name) || file.name,
      employeeId: "",
    }));
    setSpecificFiles(mapped);
  }

  function updateSpecificTitle(id: string, nextTitle: string) {
    setSpecificFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: nextTitle } : item))
    );
  }

  function updateSpecificEmployee(id: string, employeeId: string) {
    setSpecificFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, employeeId } : item))
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData();
    formData.append("mode", mode);
    formData.append("fileType", fileType);

    if (mode === "SHARED") {
      if (!sharedFile) {
        setMessage("File belum dipilih.");
        return;
      }
      if (selected.length === 0) {
        setMessage("Pilih minimal satu karyawan.");
        return;
      }
      const finalTitle = title.trim() || sharedFile.name;
      formData.append("title", finalTitle);
      formData.append("employeeIds", JSON.stringify(selected));
      formData.append("file", sharedFile);
    } else {
      if (specificFiles.length === 0) {
        setMessage("Pilih minimal satu file.");
        return;
      }
      const missingEmployee = specificFiles.find((item) => !item.employeeId);
      if (missingEmployee) {
        setMessage("Semua file harus dipasangkan ke karyawan.");
        return;
      }
      const assignments = specificFiles.map((item, index) => ({
        index,
        employeeId: item.employeeId,
        title: item.title.trim(),
      }));
      formData.append("assignments", JSON.stringify(assignments));
      specificFiles.forEach((item) => {
        formData.append("files", item.file);
      });
    }

    setLoading(true);
    setMessage(null);

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
      setSharedFile(null);
      setSpecificFiles([]);
      setFileInputKey((prev) => prev + 1);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">
            Mode pengiriman
          </label>
          <select
            value={mode}
            onChange={(e) => handleModeChange(e.target.value as UploadMode)}
            className="w-full rounded-2xl border border-[#1E453E]/15 bg-white px-4 py-2 text-sm"
          >
            <option value="SHARED">Dokumen umum (banyak karyawan)</option>
            <option value="SPECIFIC">
              Dokumen spesifik (satu file per karyawan)
            </option>
          </select>
          <p className="mt-1 text-xs text-[#6c6f6e]">
            Gunakan mode spesifik untuk dokumen yang berbeda tiap karyawan.
          </p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">
            Judul dokumen
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={mode === "SPECIFIC"}
            placeholder={
              mode === "SPECIFIC" ? "Judul per file diatur di bawah" : ""
            }
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">
            Jenis
          </label>
          <select
            value={fileType}
            onChange={(e) =>
              setFileType(e.target.value as "GENERAL" | "AGREEMENT")
            }
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
        {mode === "SHARED" ? (
          <Input
            key={`shared-${fileInputKey}`}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={handleSharedFileChange}
          />
        ) : (
          <Input
            key={`specific-${fileInputKey}`}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            multiple
            onChange={handleSpecificFilesChange}
          />
        )}
        <p className="mt-1 text-xs text-[#6c6f6e]">Perjanjian wajib PDF.</p>
      </div>

      {mode === "SHARED" ? (
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
      ) : (
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">
            Pasangkan file ke karyawan
          </label>
          <div className="space-y-3">
            {specificFiles.length === 0 ? (
              <p className="text-xs text-[#6c6f6e]">
                Belum ada file yang dipilih.
              </p>
            ) : (
              specificFiles.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-2xl border border-[#1E453E]/10 bg-white p-3 md:grid-cols-[1.4fr_1fr_1fr]"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1E453E]">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-[#6c6f6e]">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#6c6f6e]">
                      Judul
                    </label>
                    <Input
                      value={item.title}
                      onChange={(e) =>
                        updateSpecificTitle(item.id, e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#6c6f6e]">
                      Karyawan
                    </label>
                    <select
                      value={item.employeeId}
                      onChange={(e) =>
                        updateSpecificEmployee(item.id, e.target.value)
                      }
                      className="w-full rounded-2xl border border-[#1E453E]/15 bg-white px-4 py-2 text-sm"
                    >
                      <option value="">Pilih karyawan</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} · {emp.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {message ? <p className="text-sm text-[#1E453E]">{message}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Mengunggah..." : "Kirim ke karyawan"}
      </Button>
    </form>
  );
}
