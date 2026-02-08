"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction, updateProfileAction } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

type Props = {
  name: string;
  username: string;
  email: string | null;
  position?: string | null;
  workLocation?: string | null;
  phone?: string | null;
  address?: string | null;
  dob?: string | null;
  nik?: string | null;
  hasSignature: boolean;
  signatureUpdatedAt?: string | null;
};

type NoticeTone = "success" | "error" | "info";

const SIGNATURE_MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_SIGNATURE_TYPES = ["image/png", "image/jpeg"];

function toneFromMessage(message: string): NoticeTone {
  return message.toLowerCase().includes("berhasil") ? "success" : "error";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function EmployeeProfileForm(props: Props) {
  const [state, action] = useActionState(updateProfileAction, null);
  const [passwordState, passwordAction] = useActionState(changePasswordAction, null);
  const passwordFormRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();

  const [hasSignature, setHasSignature] = useState(props.hasSignature);
  const [signatureNotice, setSignatureNotice] = useState<{
    tone: NoticeTone;
    message: string;
  } | null>(null);
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [signatureVersion, setSignatureVersion] = useState(props.signatureUpdatedAt || "");
  const signatureInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (passwordState?.ok && passwordFormRef.current) {
      passwordFormRef.current.reset();
    }
  }, [passwordState]);

  async function onUploadSignature(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_SIGNATURE_TYPES.includes(file.type)) {
      setSignatureNotice({ tone: "error", message: "Format tanda tangan harus PNG/JPG." });
      if (signatureInputRef.current) signatureInputRef.current.value = "";
      return;
    }

    if (file.size > SIGNATURE_MAX_SIZE) {
      setSignatureNotice({ tone: "error", message: "Ukuran tanda tangan maksimal 2MB." });
      if (signatureInputRef.current) signatureInputRef.current.value = "";
      return;
    }

    setSignatureUploading(true);
    setSignatureNotice(null);

    try {
      const formData = new FormData();
      formData.append("signature", file);

      const res = await fetch("/api/employee/signature", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Gagal mengunggah tanda tangan.");
      }

      setHasSignature(true);
      setSignatureVersion(Date.now().toString());
      setSignatureNotice({ tone: "success", message: "Tanda tangan berhasil disimpan." });
      router.refresh();
    } catch (error: unknown) {
      setSignatureNotice({
        tone: "error",
        message: getErrorMessage(error, "Gagal mengunggah tanda tangan."),
      });
    } finally {
      setSignatureUploading(false);
      if (signatureInputRef.current) {
        signatureInputRef.current.value = "";
      }
    }
  }

  const profileNotice = state?.message
    ? { tone: toneFromMessage(state.message), message: state.message }
    : null;
  const passwordNotice = passwordState?.message
    ? { tone: toneFromMessage(passwordState.message), message: passwordState.message }
    : null;

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4" noValidate>
        <div>
          <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-[#1E453E]">
            Nama lengkap
          </label>
          <Input id="profile-name" value={props.name} disabled />
        </div>

        <div>
          <label htmlFor="profile-username" className="mb-2 block text-sm font-medium text-[#1E453E]">
            Username
          </label>
          <Input id="profile-username" value={props.username} disabled />
        </div>

        <div>
          <label htmlFor="profile-position" className="mb-2 block text-sm font-medium text-[#1E453E]">
            Jabatan
          </label>
          <Input
            id="profile-position"
            value={props.position ?? ""}
            placeholder="Belum ada jabatan"
            disabled
          />
        </div>

        <div>
          <label htmlFor="profile-work-location" className="mb-2 block text-sm font-medium text-[#1E453E]">
            Lokasi kerja
          </label>
          <Input
            id="profile-work-location"
            value={props.workLocation ?? ""}
            placeholder="Belum ada lokasi"
            disabled
          />
        </div>

        <div>
          <label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-[#1E453E]">
            Email (opsional)
          </label>
          <Input id="profile-email" value={props.email ?? ""} placeholder="Belum ada email" disabled />
        </div>

        <div>
          <label htmlFor="profile-nik" className="mb-2 block text-sm font-medium text-[#1E453E]">
            NIK
          </label>
          <Input id="profile-nik" name="nik" defaultValue={props.nik ?? ""} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="profile-phone" className="mb-2 block text-sm font-medium text-[#1E453E]">
              No. HP
            </label>
            <Input id="profile-phone" name="phone" defaultValue={props.phone ?? ""} />
          </div>
          <div>
            <label htmlFor="profile-dob" className="mb-2 block text-sm font-medium text-[#1E453E]">
              Tanggal lahir
            </label>
            <Input id="profile-dob" name="dob" type="date" defaultValue={props.dob ?? ""} />
          </div>
        </div>

        <div>
          <label htmlFor="profile-address" className="mb-2 block text-sm font-medium text-[#1E453E]">
            Alamat
          </label>
          <Input id="profile-address" name="address" defaultValue={props.address ?? ""} />
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
                <Image
                  alt="Preview tanda tangan"
                  src={`/api/employee/signature?ts=${signatureVersion}`}
                  width={240}
                  height={96}
                  unoptimized
                  className="mx-auto h-24 w-full object-contain"
                />
              ) : (
                <p className="text-xs text-[#6c6f6e]">Belum ada tanda tangan</p>
              )}
            </div>

            <div className="space-y-3">
              <input
                ref={signatureInputRef}
                id="profile-signature"
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={onUploadSignature}
                disabled={signatureUploading}
              />
              <Button
                type="button"
                variant="secondary"
                isLoading={signatureUploading}
                loadingText="Mengunggah..."
                onClick={() => signatureInputRef.current?.click()}
              >
                Unggah tanda tangan
              </Button>
              <p className="text-xs text-[#6c6f6e]">Format PNG/JPG, maksimal 2MB.</p>
              {signatureNotice ? (
                <InlineNotice tone={signatureNotice.tone} message={signatureNotice.message} />
              ) : null}
            </div>
          </div>
        </div>

        {profileNotice ? <InlineNotice tone={profileNotice.tone} message={profileNotice.message} /> : null}

        <FormSubmitButton pendingText="Menyimpan profil...">Simpan profil</FormSubmitButton>
      </form>

      <form
        ref={passwordFormRef}
        action={passwordAction}
        className="space-y-4 rounded-2xl border border-[#1E453E]/10 bg-white p-4"
        noValidate
      >
        <div>
          <p className="text-sm font-semibold text-[#1E453E]">Ubah kata sandi</p>
          <p className="text-xs text-[#6c6f6e]">
            Minimal 8 karakter. Pastikan kata sandi baru berbeda dari sebelumnya.
          </p>
        </div>

        <div>
          <label htmlFor="current-password" className="mb-2 block text-sm font-medium text-[#1E453E]">
            Kata sandi lama
          </label>
          <Input id="current-password" name="currentPassword" type="password" required />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-[#1E453E]">
              Kata sandi baru
            </label>
            <Input id="new-password" name="newPassword" type="password" required minLength={8} />
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-[#1E453E]">
              Konfirmasi kata sandi baru
            </label>
            <Input id="confirm-password" name="confirmPassword" type="password" required minLength={8} />
          </div>
        </div>

        {passwordNotice ? <InlineNotice tone={passwordNotice.tone} message={passwordNotice.message} /> : null}

        <FormSubmitButton pendingText="Memperbarui...">Perbarui kata sandi</FormSubmitButton>
      </form>
    </div>
  );
}
