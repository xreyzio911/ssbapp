"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InlineNotice } from "@/components/ui/inline-notice";

type Assignment = {
  id: string;
  status: "PENDING" | "SIGNED";
  fileType: "GENERAL" | "AGREEMENT";
  title: string;
  mimeType: string;
  size: number;
  assignedAt: string;
  signedAt?: string | null;
};

type NoticeTone = "success" | "error" | "info";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function HrFileCard({
  assignment,
  hasSignature,
  signerName,
}: {
  assignment: Assignment;
  hasSignature: boolean;
  signerName: string;
}) {
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [openLoading, setOpenLoading] = useState(false);
  const [signLoading, setSignLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const router = useRouter();
  const fileEndpoint = `/api/employee/hr-files/${assignment.id}/blob`;

  useEffect(() => {
    return () => {
      if (fileUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  async function openFile() {
    setNotice({ tone: "info", message: "Memuat dokumen..." });
    setOpenLoading(true);

    try {
      if (assignment.fileType !== "AGREEMENT") {
        setFileBytes(null);
        if (fileUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(fileUrl);
        }
        setFileUrl(fileEndpoint);
        setNotice(null);
        return;
      }

      const blobRes = await fetch(fileEndpoint);
      if (!blobRes.ok) {
        const data = (await blobRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Gagal mengambil dokumen.");
      }

      const bytes = new Uint8Array(await blobRes.arrayBuffer());
      setFileBytes(bytes);

      if (fileUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }

      const url = URL.createObjectURL(new Blob([bytes], { type: assignment.mimeType }));
      setFileUrl(url);
      setNotice(null);
    } catch (error: unknown) {
      setNotice({ tone: "error", message: getErrorMessage(error, "Gagal memuat dokumen.") });
    } finally {
      setOpenLoading(false);
    }
  }

  async function submitSignature() {
    if (!fileBytes) return;

    if (!hasSignature) {
      setNotice({
        tone: "error",
        message: "Simpan tanda tangan di tab Profil terlebih dahulu.",
      });
      return;
    }

    setNotice({ tone: "info", message: "Menyimpan tanda tangan..." });
    setSignLoading(true);

    try {
      const sigRes = await fetch("/api/employee/signature");
      if (!sigRes.ok) {
        throw new Error("Tanda tangan belum tersedia.");
      }

      const sigBytes = new Uint8Array(await sigRes.arrayBuffer());
      const sigMime = sigRes.headers.get("Content-Type") || "image/png";

      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      const page = pages[pages.length - 1];
      const { width } = page.getSize();
      const sigWidth = 180;
      const sigHeight = 70;

      const signatureImage =
        sigMime.includes("jpeg") || sigMime.includes("jpg")
          ? await pdfDoc.embedJpg(sigBytes)
          : await pdfDoc.embedPng(sigBytes);
      const scaled = signatureImage.scaleToFit(sigWidth, sigHeight);

      page.drawImage(signatureImage, {
        x: width - scaled.width - 40,
        y: 80,
        width: scaled.width,
        height: scaled.height,
      });

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const timestamp = new Date().toLocaleString("id-ID");

      page.drawText(`Ditandatangani oleh ${signerName}`, {
        x: 40,
        y: 70,
        size: 10,
        font,
        color: rgb(0.12, 0.27, 0.24),
      });
      page.drawText(`Waktu: ${timestamp}`, {
        x: 40,
        y: 55,
        size: 10,
        font,
        color: rgb(0.12, 0.27, 0.24),
      });

      const signedBytes = await pdfDoc.save();
      const normalizedSignedBytes = new Uint8Array(signedBytes);
      const formData = new FormData();
      formData.append(
        "signedPdf",
        new Blob([normalizedSignedBytes], { type: "application/pdf" }),
        "signed.pdf"
      );
      formData.append("signerName", signerName);
      formData.append("signedAt", new Date().toISOString());

      const res = await fetch(`/api/employee/hr-files/${assignment.id}/sign`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Gagal menyimpan tanda tangan.");
      }

      setNotice({ tone: "success", message: "Dokumen berhasil ditandatangani." });
      router.refresh();
    } catch (error: unknown) {
      setNotice({ tone: "error", message: getErrorMessage(error, "Gagal menyimpan tanda tangan.") });
    } finally {
      setSignLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1E453E]">{assignment.title}</p>
          <p className="text-xs text-[#6c6f6e]">
            {assignment.fileType === "AGREEMENT" ? "Perjanjian" : "Dokumen HR"} ·{" "}
            {new Date(assignment.assignedAt).toLocaleDateString("id-ID")}
          </p>
        </div>
        <Badge tone={assignment.status === "SIGNED" ? "green" : "yellow"}>
          {assignment.status === "SIGNED" ? "Sudah ditandatangani" : "Menunggu"}
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={openFile}
            isLoading={openLoading}
            loadingText="Memuat..."
            disabled={signLoading}
          >
            Buka dokumen
          </Button>

          {fileUrl ? (
            <>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#1E453E]/20 px-4 py-2 text-sm font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
              >
                Buka di tab baru
              </a>
              <a
                href={fileUrl}
                download
                className="rounded-full bg-[#1E453E]/10 px-4 py-2 text-sm font-medium text-[#1E453E]"
              >
                Unduh
              </a>
            </>
          ) : null}

          {assignment.fileType === "AGREEMENT" && assignment.status === "PENDING" ? (
            <Button
              type="button"
              variant="secondary"
              onClick={submitSignature}
              disabled={!fileBytes || !hasSignature || openLoading}
              isLoading={signLoading}
              loadingText="Menyimpan..."
            >
              Tandatangani
            </Button>
          ) : null}
        </div>

        {!hasSignature && assignment.fileType === "AGREEMENT" && assignment.status === "PENDING" ? (
          <p className="text-xs text-[#6c6f6e]">
            Simpan tanda tangan di tab Profil sebelum menandatangani.
          </p>
        ) : null}

        {notice ? <InlineNotice tone={notice.tone} message={notice.message} /> : null}

        {fileUrl ? (
          <div className="mt-2 overflow-hidden rounded-2xl border border-[#1E453E]/10">
            <iframe
              title={`Pratinjau ${assignment.title}`}
              src={fileUrl}
              className="h-[68vh] min-h-[360px] w-full md:h-[72vh]"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
