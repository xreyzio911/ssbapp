"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  email: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  dob?: string | null;
  nik?: string | null;
  hasSignature: boolean;
  signatureUpdatedAt?: string | null;
};

export function EmployeeProfileForm(props: Props) {
  const [state, action] = useActionState(updateProfileAction, null);
  const router = useRouter();
  const [hasSignature, setHasSignature] = useState(props.hasSignature);
  const [signatureMessage, setSignatureMessage] = useState<string | null>(null);
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [signatureVersion, setSignatureVersion] = useState(
    props.signatureUpdatedAt || ""
  );
  const signatureInputRef = useRef<HTMLInputElement | null>(null);

  async function onUploadSignature(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSignatureUploading(true);
    setSignatureMessage(null);

    const formData = new FormData();
    formData.append("signature", file);

    const res = await fetch("/api/employee/signature", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json();
      setSignatureMessage(data.error || "Gagal mengunggah tanda tangan.");
    } else {
      setHasSignature(true);
      setSignatureVersion(Date.now().toString());
      setSignatureMessage("Tanda tangan berhasil disimpan.");
      router.refresh();
    }
    setSignatureUploading(false);
    if (signatureInputRef.current) {
      signatureInputRef.current.value = "";
    }
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Nama lengkap
        </label>
        <Input value={props.name} disabled />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Email
        </label>
        <Input value={props.email} disabled />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          NIK
        </label>
        <Input name="nik" defaultValue={props.nik ?? ""} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">
            No. HP
          </label>
          <Input name="phone" defaultValue={props.phone ?? ""} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#1E453E]">
            Tanggal lahir
          </label>
          <Input name="dob" type="date" defaultValue={props.dob ?? ""} />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#1E453E]">
          Alamat
        </label>
        <Input name="address" defaultValue={props.address ?? ""} />
      </div>
      <div className="rounded-2xl border border-[#1E453E]/10 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1E453E]">Tanda tangan</p>
            <p className="text-xs text-[#6c6f6e]">
              Unggah satu kali untuk tanda tangan otomatis pada perjanjian.
            </p>
          </div>
          {hasSignature ? (
            <span className="rounded-full border border-[#1E453E]/15 bg-white px-3 py-1 text-xs font-medium text-[#1E453E]">
              Tersimpan
            </span>
          ) : (
            <span className="rounded-full border border-[#D4AF37]/40 bg-[#fff7e1] px-3 py-1 text-xs font-medium text-[#1E453E]">
              Belum ada
            </span>
          )}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[200px_1fr]">
          <div className="rounded-2xl border border-[#1E453E]/10 bg-[#f7f7f2] p-3 text-center">
            {hasSignature ? (
              <img
                alt="Preview tanda tangan"
                src={`/api/employee/signature?ts=${signatureVersion}`}
                className="mx-auto h-24 w-full object-contain"
              />
            ) : (
              <p className="text-xs text-[#6c6f6e]">
                Belum ada tanda tangan
              </p>
            )}
          </div>
          <div className="space-y-3">
            <input
              ref={signatureInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={onUploadSignature}
              disabled={signatureUploading}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={signatureUploading}
              onClick={() => signatureInputRef.current?.click()}
            >
              {signatureUploading ? "Mengunggah..." : "Unggah tanda tangan"}
            </Button>
            <p className="text-xs text-[#6c6f6e]">
              Format PNG/JPG, maksimal 2MB.
            </p>
            {signatureMessage ? (
              <p className="text-xs text-[#1E453E]">{signatureMessage}</p>
            ) : null}
          </div>
        </div>
      </div>
      {state?.message ? (
        <p className="text-sm text-[#1E453E]">{state.message}</p>
      ) : null}
      <Button type="submit">Simpan profil</Button>
    </form>
  );
}


