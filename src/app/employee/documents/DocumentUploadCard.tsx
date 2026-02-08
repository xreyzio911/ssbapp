"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InlineNotice } from "@/components/ui/inline-notice";

type Props = {
  docType: string;
  label: string;
  status: string;
  lastUploaded?: string;
  updateNote?: string | null;
};

type NoticeTone = "success" | "error" | "info";

const MAX_SIZE = 10 * 1024 * 1024;
const FALLBACK_ERROR = "STORAGE_NOT_S3";

function getErrorMessage(error: unknown, fallback = "Gagal mengunggah.") {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function DocumentUploadCard({
  docType,
  label,
  status,
  lastUploaded,
  updateNote,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = `upload-${docType.toLowerCase()}`;

  async function uploadLocal(fileToUpload: File) {
    const formData = new FormData();
    formData.append("docType", docType);
    formData.append("file", fileToUpload);

    const res = await fetch("/api/employee/documents/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error || "Gagal mengunggah.");
    }
  }

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setNotice({ tone: "error", message: "Ukuran file maksimal 10MB." });
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const presignRes = await fetch("/api/employee/documents/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });

      if (presignRes.ok) {
        const presign = (await presignRes.json()) as {
          uploadUrl: string;
          uploadToken: string;
        };

        try {
          const uploadRes = await fetch(presign.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!uploadRes.ok) {
            throw new Error("Gagal mengunggah ke penyimpanan.");
          }

          const completeRes = await fetch("/api/employee/documents/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uploadToken: presign.uploadToken }),
          });

          if (!completeRes.ok) {
            const data = (await completeRes.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(data.error || "Gagal menyimpan dokumen.");
          }
        } catch {
          await uploadLocal(file);
        }
      } else {
        const presignError = (await presignRes.json().catch(() => ({}))) as {
          error?: string;
        };

        if (presignError.error !== FALLBACK_ERROR) {
          throw new Error(presignError.error || "Gagal menyiapkan unggahan.");
        }

        await uploadLocal(file);
      }

      setNotice({ tone: "success", message: "Dokumen berhasil diunggah." });
      router.refresh();
    } catch (error: unknown) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
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
          id={inputId}
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
          isLoading={loading}
          loadingText="Mengunggah..."
          aria-controls={inputId}
          onClick={() => inputRef.current?.click()}
        >
          Unggah / Ganti
        </Button>
      </div>

      {status === "Perlu pembaruan" && updateNote ? (
        <InlineNotice
          className="mt-3"
          tone="info"
          message={`Catatan HR: ${updateNote}`}
        />
      ) : null}

      {notice ? (
        <InlineNotice
          className="mt-3"
          tone={notice.tone}
          message={notice.message}
        />
      ) : null}

      <p className="mt-2 text-xs text-[#6c6f6e]">Maksimal 10MB. PDF/JPG/PNG.</p>
    </div>
  );
}
