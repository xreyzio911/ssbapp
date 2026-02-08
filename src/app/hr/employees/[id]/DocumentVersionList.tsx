"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type DocumentVersionItem = {
  id: string;
  title: string;
  subtitle: string;
  originalFilename?: string;
  previewHref: string;
  downloadHref: string;
};

type DocumentVersionListProps = {
  items: DocumentVersionItem[];
  emptyText: string;
};

export function DocumentVersionList({ items, emptyText }: DocumentVersionListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (activeUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [activeUrl]);

  async function openDocument(item: DocumentVersionItem) {
    setLoadingId(item.id);
    setErrorMessage(null);

    try {
      const res = await fetch(item.downloadHref);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Gagal memuat dokumen.");
      }

      const blob = await res.blob();
      if (activeUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(activeUrl);
      }

      setActiveUrl(URL.createObjectURL(blob));
      setActiveId(item.id);
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Gagal memuat dokumen.";
      setErrorMessage(message);
      setActiveId(item.id);
      setActiveUrl(null);
    } finally {
      setLoadingId(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-xs text-[#6c6f6e]">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const open = activeId === item.id;
        const loading = loadingId === item.id;

        return (
          <div
            key={item.id}
            className="rounded-2xl border border-[#1E453E]/10 bg-white px-4 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1E453E] break-all">{item.title}</p>
                <p className="text-xs text-[#6c6f6e]">{item.subtitle}</p>
                {item.originalFilename ? (
                  <p className="text-xs text-[#6c6f6e]">Asli: {item.originalFilename}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => openDocument(item)}
                  isLoading={loading}
                  loadingText="Memuat..."
                >
                  Buka dokumen
                </Button>
                <a
                  href={item.previewHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full border border-[#1E453E]/20 px-3 py-1.5 text-xs font-medium text-[#1E453E] transition hover:bg-[#1E453E]/10"
                >
                  Buka di tab baru
                </a>
                <a
                  href={item.downloadHref}
                  className="rounded-full bg-[#1E453E]/10 px-3 py-1.5 text-xs font-medium text-[#1E453E]"
                >
                  Unduh
                </a>
              </div>
            </div>

            {open && errorMessage ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-[#fde8e8] px-3 py-2 text-xs text-[#9f1d1d]">
                {errorMessage}
              </p>
            ) : null}

            {open && activeUrl ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-[#1E453E]/10">
                <iframe
                  title={`Pratinjau ${item.title}`}
                  src={activeUrl}
                  className="h-[68vh] min-h-[360px] w-full md:h-[72vh]"
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
