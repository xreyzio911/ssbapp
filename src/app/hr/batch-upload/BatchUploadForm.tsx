"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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

type UploadMode = "SHARED" | "SPECIFIC";

type SpecificFile = {
  id: string;
  file: File;
  title: string;
  employeeId: string;
};

type NoticeTone = "success" | "error" | "info";

const MAX_SIZE = 10 * 1024 * 1024;

function stripExtension(name: string) {
  return name.replace(/\.[^/.]+$/, "");
}

export function BatchUploadForm({ employees }: { employees: Employee[] }) {
  const [mode, setMode] = useState<UploadMode>("SHARED");
  const [selected, setSelected] = useState<string[]>([]);
  const [fileType, setFileType] = useState<"GENERAL" | "AGREEMENT">("GENERAL");
  const [title, setTitle] = useState("");
  const [sharedFile, setSharedFile] = useState<File | null>(null);
  const [specificFiles, setSpecificFiles] = useState<SpecificFile[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"NAME_ASC" | "NAME_DESC" | "POSITION" | "LOCATION">(
    "NAME_ASC"
  );
  const [fileInputKey, setFileInputKey] = useState(0);

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

  function showError(message: string) {
    setNotice({ tone: "error", message });
  }

  function showSuccess(message: string) {
    setNotice({ tone: "success", message });
  }

  function clearNotice() {
    setNotice(null);
  }

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
    clearNotice();
    setFileInputKey((prev) => prev + 1);
  }

  function toggleEmployee(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function selectAllEmployees() {
    setSelected(employees.map((employee) => employee.id));
  }

  function selectFilteredEmployees() {
    setSelected(filtered.map((employee) => employee.id));
  }

  function clearSelection() {
    setSelected([]);
  }

  function handleSharedFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_SIZE) {
      showError("Ukuran file maksimal 10MB.");
      setSharedFile(null);
      setFileInputKey((prev) => prev + 1);
      return;
    }
    clearNotice();
    setSharedFile(file);
  }

  function handleSpecificFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const oversized = files.filter((file) => file.size > MAX_SIZE);

    if (oversized.length > 0) {
      const names = oversized.map((file) => file.name).join(", ");
      showError(
        oversized.length === files.length
          ? "Semua file melebihi 10MB."
          : `File melebihi 10MB tidak akan diunggah: ${names}`
      );
    } else {
      clearNotice();
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
        showError("File belum dipilih.");
        return;
      }
      if (sharedFile.size > MAX_SIZE) {
        showError("Ukuran file maksimal 10MB.");
        return;
      }
      if (selected.length === 0) {
        showError("Pilih minimal satu karyawan.");
        return;
      }

      const finalTitle = title.trim() || sharedFile.name;
      formData.append("title", finalTitle);
      formData.append("employeeIds", JSON.stringify(selected));
      formData.append("file", sharedFile);
    } else {
      if (specificFiles.length === 0) {
        showError("Pilih minimal satu file.");
        return;
      }
      if (specificFiles.some((item) => item.file.size > MAX_SIZE)) {
        showError("Ukuran file maksimal 10MB.");
        return;
      }
      const missingEmployee = specificFiles.find((item) => !item.employeeId);
      if (missingEmployee) {
        showError("Semua file harus dipasangkan ke karyawan.");
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
    clearNotice();

    try {
      const res = await fetch("/api/hr/files/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        showError(data.error || "Gagal mengunggah.");
        return;
      }

      showSuccess("File berhasil diunggah dan dikirim.");
      setSelected([]);
      setTitle("");
      setSharedFile(null);
      setSpecificFiles([]);
      setFileInputKey((prev) => prev + 1);
    } catch {
      showError("Gagal mengunggah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="batch-mode" className="mb-2 block text-sm font-medium text-[#1E453E]">
            Mode pengiriman
          </label>
          <Select
            id="batch-mode"
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as UploadMode)}
          >
            <option value="SHARED">Dokumen umum (banyak karyawan)</option>
            <option value="SPECIFIC">Dokumen spesifik (satu file per karyawan)</option>
          </Select>
          <p className="mt-1 text-xs text-[#6c6f6e]">
            Gunakan mode spesifik untuk dokumen yang berbeda tiap karyawan.
          </p>
        </div>

        <div>
          <label htmlFor="batch-title" className="mb-2 block text-sm font-medium text-[#1E453E]">
            Judul dokumen
          </label>
          <Input
            id="batch-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={mode === "SPECIFIC"}
            placeholder={mode === "SPECIFIC" ? "Judul per file diatur di bawah" : ""}
          />
        </div>

        <div>
          <label htmlFor="batch-file-type" className="mb-2 block text-sm font-medium text-[#1E453E]">
            Jenis
          </label>
          <Select
            id="batch-file-type"
            value={fileType}
            onChange={(event) => setFileType(event.target.value as "GENERAL" | "AGREEMENT")}
          >
            <option value="GENERAL">Dokumen HR</option>
            <option value="AGREEMENT">Perjanjian (PDF)</option>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="batch-file" className="mb-2 block text-sm font-medium text-[#1E453E]">
          File
        </label>
        {mode === "SHARED" ? (
          <Input
            id="batch-file"
            key={`shared-${fileInputKey}`}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={handleSharedFileChange}
          />
        ) : (
          <Input
            id="batch-file"
            key={`specific-${fileInputKey}`}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            multiple
            onChange={handleSpecificFilesChange}
          />
        )}
        <p className="mt-1 text-xs text-[#6c6f6e]">Maksimal 10MB. Perjanjian wajib PDF.</p>
      </div>

      {mode === "SHARED" ? (
        <div className="space-y-3">
          <label htmlFor="batch-employee-search" className="block text-sm font-medium text-[#1E453E]">
            Pilih karyawan
          </label>
          <Input
            id="batch-employee-search"
            placeholder="Cari karyawan"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor="batch-filter-position" className="mb-1 block text-xs text-[#6c6f6e]">
                Filter jabatan
              </label>
              <Select
                id="batch-filter-position"
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
              <label htmlFor="batch-filter-location" className="mb-1 block text-xs text-[#6c6f6e]">
                Filter lokasi
              </label>
              <Select
                id="batch-filter-location"
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
              <label htmlFor="batch-sort" className="mb-1 block text-xs text-[#6c6f6e]">
                Urutkan
              </label>
              <Select
                id="batch-sort"
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

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={selectAllEmployees}>
              Pilih semua
            </Button>
            <Button type="button" variant="ghost" onClick={selectFilteredEmployees}>
              Pilih hasil filter
            </Button>
            {selected.length > 0 ? (
              <Button type="button" variant="ghost" onClick={clearSelection}>
                Bersihkan
              </Button>
            ) : null}
          </div>

          <div className="max-h-56 space-y-2 overflow-auto rounded-2xl border border-[#1E453E]/10 bg-white p-3">
            {filtered.map((employee) => (
              <label key={employee.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(employee.id)}
                  onChange={() => toggleEmployee(employee.id)}
                />
                <span>
                  {employee.name} - {employee.email ?? "Tanpa email"} - {employee.username}
                  {employee.position ? ` - ${employee.position}` : ""}
                  {employee.workLocation ? ` - ${employee.workLocation}` : ""}
                </span>
              </label>
            ))}

            {filtered.length === 0 ? <p className="text-xs text-[#6c6f6e]">Tidak ada karyawan.</p> : null}
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">Pasangkan file ke karyawan</label>
          <div className="space-y-3">
            {specificFiles.length === 0 ? (
              <p className="text-xs text-[#6c6f6e]">Belum ada file yang dipilih.</p>
            ) : (
              specificFiles.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-2xl border border-[#1E453E]/10 bg-white p-3 md:grid-cols-[1.4fr_1fr_1fr]"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1E453E]">{item.file.name}</p>
                    <p className="text-xs text-[#6c6f6e]">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>

                  <div>
                    <label htmlFor={`specific-title-${item.id}`} className="mb-1 block text-xs text-[#6c6f6e]">
                      Judul
                    </label>
                    <Input
                      id={`specific-title-${item.id}`}
                      value={item.title}
                      onChange={(event) => updateSpecificTitle(item.id, event.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor={`specific-employee-${item.id}`} className="mb-1 block text-xs text-[#6c6f6e]">
                      Karyawan
                    </label>
                    <Select
                      id={`specific-employee-${item.id}`}
                      value={item.employeeId}
                      onChange={(event) => updateSpecificEmployee(item.id, event.target.value)}
                    >
                      <option value="">Pilih karyawan</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} - {employee.email ?? "Tanpa email"} - {employee.username}
                          {employee.position ? ` - ${employee.position}` : ""}
                          {employee.workLocation ? ` - ${employee.workLocation}` : ""}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {notice ? <InlineNotice tone={notice.tone} message={notice.message} /> : null}

      <Button type="submit" isLoading={loading} loadingText="Mengunggah...">
        Kirim ke karyawan
      </Button>
    </form>
  );
}
