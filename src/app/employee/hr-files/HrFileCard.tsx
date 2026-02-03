"use client";

import { useEffect, useRef, useState } from "react";
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

export function HrFileCard({ assignment }: { assignment: Assignment }) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [showSign, setShowSign] = useState(false);
  const [signerName, setSignerName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function startSignature() {
    setShowSign(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1E453E";
      ctx.lineCap = "round";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, 50);
  }

  function bindDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let drawing = false;

    const getPoint = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onDown = (event: PointerEvent) => {
      drawing = true;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { x, y } = getPoint(event);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const onMove = (event: PointerEvent) => {
      if (!drawing) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { x, y } = getPoint(event);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const onUp = () => {
      drawing = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onUp);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onUp);
    };
  }

  useEffect(() => {
    if (!showSign) return;
    const cleanup = bindDrawing();
    return () => {
      cleanup?.();
    };
  }, [showSign]);

  async function submitSignature() {
    if (!fileBytes) return;
    if (!signerName.trim()) {
      setStatus("Nama penanda tangan wajib diisi.");
      return;
    }
    setStatus("Menyimpan tanda tangan...");
    try {
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      const page = pages[pages.length - 1];
      const pngData = canvasRef.current?.toDataURL("image/png");
      if (!pngData) {
        throw new Error("Tanda tangan kosong.");
      }
      const pngImage = await pdfDoc.embedPng(pngData);
      const { width, height } = page.getSize();
      const sigWidth = 180;
      const sigHeight = 60;
      page.drawImage(pngImage, {
        x: width - sigWidth - 40,
        y: 80,
        width: sigWidth,
        height: sigHeight,
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
      setShowSign(false);
      router.refresh();
    } catch (err: any) {
      setStatus(err.message || "Gagal menyimpan tanda tangan.");
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
            <Button type="button" variant="secondary" onClick={startSignature} disabled={!fileBytes}>
              Tandatangani
            </Button>
          ) : null}
        </div>
        {status ? <p className="text-xs text-[#1E453E]">{status}</p> : null}
        {fileUrl ? (
          <div className="mt-2 overflow-hidden rounded-2xl border border-[#1E453E]/10">
            <iframe title="Dokumen" src={fileUrl} className="h-64 w-full" />
          </div>
        ) : null}
      </div>

      {showSign ? (
        <div className="mt-4 rounded-2xl border border-[#1E453E]/10 bg-[#f7f7f2] p-4">
          <p className="text-sm font-medium text-[#1E453E]">Tanda tangan</p>
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-[#1E453E]">
              Nama penanda tangan
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(event) => setSignerName(event.target.value)}
              className="w-full rounded-2xl border border-[#1E453E]/15 bg-white px-4 py-2 text-sm"
            />
          </div>
          <div className="mt-3 rounded-2xl border border-dashed border-[#1E453E]/30 bg-white">
            <canvas
              ref={(node) => {
                canvasRef.current = node;
                if (node) {
                  node.width = 420;
                  node.height = 160;
                }
              }}
              className="h-40 w-full touch-none"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={clearCanvas}>
              Bersihkan
            </Button>
            <Button type="button" variant="secondary" onClick={submitSignature}>
              Simpan tanda tangan
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
