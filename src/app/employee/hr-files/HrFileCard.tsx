"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { useRouter } from "next/navigation";

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

export function HrFileCard({
  assignment,
  hasSignature,
  signerName,
}: {
  assignment: Assignment;
  hasSignature: boolean;
  signerName: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const router = useRouter();

  async function openFile() {
    setStatus("Memuat dokumen...");
    setLoading(true);
    try {
      const blobRes = await fetch(`/api/employee/hr-files/${assignment.id}/blob`);
      if (!blobRes.ok) {
        const data = await blobRes.json();
        throw new Error(data.error || "Gagal mengambil dokumen.");
      }
      const bytes = new Uint8Array(await blobRes.arrayBuffer());
      setFileBytes(bytes);
      const url = URL.createObjectURL(new Blob([bytes], { type: assignment.mimeType }));
      setFileUrl(url);
      setStatus(null);
    } catch (err: any) {
      setStatus(err.message || "Gagal memuat dokumen.");
    }
    setLoading(false);
  }

  async function submitSignature() {
    if (!fileBytes) return;
    if (!hasSignature) {
      setStatus("Simpan tanda tangan di tab Profil terlebih dahulu.");
      return;
    }
    setStatus("Menyimpan tanda tangan...");
    setLoading(true);
    try {
      const sigRes = await fetch("/api/employee/signature");
      if (!sigRes.ok) {
        throw new Error("Tanda tangan belum tersedia.");
      }
      const sigBytes = new Uint8Array(await sigRes.arrayBuffer());
      const sigMime = sigRes.headers.get("Content-Type") || "image/png";

      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      const page = pages[pages.length - 1];
      const { width, height } = page.getSize();
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
      const signedBytes = (await pdfDoc.save()) as Uint8Array<ArrayBuffer>;

      const formData = new FormData();
      formData.append("signedPdf", new Blob([signedBytes], { type: "application/pdf" }), "signed.pdf");
      formData.append("signerName", signerName);
      formData.append("signedAt", new Date().toISOString());

      const res = await fetch(`/api/employee/hr-files/${assignment.id}/sign`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan tanda tangan.");
      }

      setStatus("Dokumen berhasil ditandatangani.");
      router.refresh();
    } catch (err: any) {
      setStatus(err.message || "Gagal menyimpan tanda tangan.");
    }
    setLoading(false);
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
          {assignment.status === "SIGNED"
            ? "Sudah ditandatangani"
            : "Menunggu"}
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={openFile} disabled={loading}>
            Buka dokumen
          </Button>
          {fileUrl ? (
            <a
              href={fileUrl}
              download
              className="rounded-full bg-[#1E453E]/10 px-4 py-2 text-sm font-medium text-[#1E453E]"
            >
              Unduh
            </a>
          ) : null}
          {assignment.fileType === "AGREEMENT" && assignment.status === "PENDING" ? (
            <Button
              type="button"
              variant="secondary"
              onClick={submitSignature}
              disabled={!fileBytes || loading || !hasSignature}
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
        {status ? <p className="text-xs text-[#1E453E]">{status}</p> : null}
        {fileUrl ? (
          <div className="mt-2 overflow-hidden rounded-2xl border border-[#1E453E]/10">
            <iframe
              title="Dokumen"
              src={fileUrl}
              className="h-[520px] w-full md:h-[640px]"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
