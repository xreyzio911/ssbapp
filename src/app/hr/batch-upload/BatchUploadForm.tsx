"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Employee = {
  id: string;
  name: string;
  email: string | null;
  username: string;
  position?: string | null;
  workLocation?: string | null;
};

type UploadMode = "SHARED" | "SPECIFIC";

type SpecificFile = {
  id: string;
  file: File;
  title: string;
  employeeId: string;
};

const MAX_SIZE = 10 * 1024 * 1024;

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
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<
    "NAME_ASC" | "NAME_DESC" | "POSITION" | "LOCATION"
  >("NAME_ASC");
  const [fileInputKey, setFileInputKey] = useState(0);

  const positions = useMemo(() => {
    const unique = new Set<string>();
    employees.forEach((emp) => {
      if (emp.position) {
        unique.add(emp.position);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "id"));
  }, [employees]);

  const locations = useMemo(() => {
    const unique = new Set<string>();
    employees.forEach((emp) => {
      if (emp.workLocation) {
        unique.add(emp.workLocation);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "id"));
  }, [employees]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.username.toLowerCase().includes(q) ||
        (emp.email ? emp.email.toLowerCase().includes(q) : false)
    );
    if (positionFilter !== "ALL") {
      list = list.filter((emp) => emp.position === positionFilter);
    }
    if (locationFilter !== "ALL") {
      list = list.filter((emp) => emp.workLocation === locationFilter);
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
  }, [employees, query, positionFilter, locationFilter, sortBy]);

  function handleModeChange(nextMode: UploadMode) {
    setMode(nextMode);
    setSelected([]);
    setTitle("");
    setSharedFile(null);
    setSpecificFiles([]);
    setQuery("");
    setPositionFilter("ALL");
    setLocationFilter("ALL");
    setSortBy("NAME_ASC");
    setMessage(null);
    setFileInputKey((prev) => prev + 1);
  }

  function toggleEmployee(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function selectAllEmployees() {
    setSelected(employees.map((emp) => emp.id));
  }

  function selectFilteredEmployees() {
    setSelected(filtered.map((emp) => emp.id));
  }

  function clearSelection() {
    setSelected([]);
  }

  function handleSharedFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_SIZE) {
      setMessage("Ukuran file maksimal 10MB.");
      setSharedFile(null);
      setFileInputKey((prev) => prev + 1);
      return;
    }
    setMessage(null);
    setSharedFile(file);
  }

  function handleSpecificFilesChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);
    const oversized = files.filter((file) => file.size > MAX_SIZE);
    if (oversized.length > 0) {
      const names = oversized.map((file) => file.name).join(", ");
      setMessage(
        oversized.length === files.length
          ? "Semua file melebihi 10MB."
          : `File melebihi 10MB tidak akan diunggah: ${names}`
      );
    } else {
      setMessage(null);
    }
    const validFiles = files.filter((file) => file.size <= MAX_SIZE);
    if (validFiles.length === 0) {
      setSpecificFiles([]);
      setFileInputKey((prev) => prev + 1);
      return;
    }
    const mapped = validFiles.map((file, index) => ({
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
      if (sharedFile.size > MAX_SIZE) {
        setMessage("Ukuran file maksimal 10MB.");
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
      if (specificFiles.some((item) => item.file.size > MAX_SIZE)) {
        setMessage("Ukuran file maksimal 10MB.");
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
        <p className="mt-1 text-xs text-[#6c6f6e]">
          Maksimal 10MB. Perjanjian wajib PDF.
        </p>
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
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-[#6c6f6e]">
                Filter jabatan
              </label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full rounded-2xl border border-[#1E453E]/15 bg-white px-4 py-2 text-sm"
              >
                <option value="ALL">Semua jabatan</option>
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#6c6f6e]">
                Filter lokasi
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full rounded-2xl border border-[#1E453E]/15 bg-white px-4 py-2 text-sm"
              >
                <option value="ALL">Semua lokasi</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#6c6f6e]">Urutkan</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full rounded-2xl border border-[#1E453E]/15 bg-white px-4 py-2 text-sm"
              >
                <option value="NAME_ASC">Nama (A-Z)</option>
                <option value="NAME_DESC">Nama (Z-A)</option>
                <option value="POSITION">Jabatan</option>
                <option value="LOCATION">Lokasi kerja</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAllEmployees}
              className="rounded-full border border-[#1E453E]/20 px-4 py-2 text-xs font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
            >
              Pilih semua
            </button>
            <button
              type="button"
              onClick={selectFilteredEmployees}
              className="rounded-full border border-[#1E453E]/20 px-4 py-2 text-xs font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
            >
              Pilih hasil filter
            </button>
            {selected.length > 0 ? (
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-full border border-[#1E453E]/20 px-4 py-2 text-xs font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
              >
                Bersihkan
              </button>
            ) : null}
          </div>
          <div className="mt-3 max-h-56 space-y-2 overflow-auto rounded-2xl border border-[#1E453E]/10 bg-white p-3">
            {filtered.map((emp) => (
              <label key={emp.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(emp.id)}
                  onChange={() => toggleEmployee(emp.id)}
                />
                <span>
                  {emp.name} - {emp.email ?? "Tanpa email"} - {emp.username}
                  {emp.position ? ` - ${emp.position}` : ""}
                  {emp.workLocation ? ` - ${emp.workLocation}` : ""}
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
                          {emp.name} - {emp.email ?? "Tanpa email"} - {emp.username}
                          {emp.position ? ` - ${emp.position}` : ""}
                          {emp.workLocation ? ` - ${emp.workLocation}` : ""}
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
