"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  docType: string;
  label: string;
  status: string;
  lastUploaded?: string;
};

export function DocumentUploadCard({
  docType,
  label,
  status,
  lastUploaded,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("docType", docType);
    formData.append("file", file);

    const res = await fetch("/api/employee/documents/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Gagal mengunggah.");
    } else {
      setMessage("Berhasil diunggah.");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1E453E]">{label}</p>
          <p className="text-xs text-[#6c6f6e]">
            {lastUploaded ? `Terakhir: ${lastUploaded}` : "Belum ada file"}
          </p>
        </div>
        <Badge
          tone={
            status === "Sudah diunggah"
              ? "green"
              : status === "Perlu pembaruan"
              ? "yellow"
              : "gray"
          }
        >
          {status}
        </Badge>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onUpload}
          disabled={loading}
          accept="application/pdf,image/jpeg,image/png"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? "Mengunggah..." : "Unggah / Ganti"}
        </Button>
        {message ? (
          <span className="text-xs text-[#1E453E]">{message}</span>
        ) : null}
      </div>
    </div>
  );
}
