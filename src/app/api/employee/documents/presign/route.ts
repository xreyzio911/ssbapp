import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { DocType, UserRole } from "@/lib/enums";
import { hasRole } from "@/lib/guards";
import { buildEmployeeStoredFilename } from "@/lib/filename";
import { getS3Bucket, getS3Client, getStorageDriver } from "@/lib/storage";
import { createUploadToken } from "@/lib/upload-token";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];
const PRESIGN_EXPIRY_SECONDS = 300;
const TOKEN_EXPIRY_SECONDS = 900;

type PresignBody = {
  docType: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!hasRole(user, UserRole.EMPLOYEE)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    if (getStorageDriver() !== "s3") {
      return NextResponse.json(
        { error: "Konfigurasi storage tidak valid. Wajib gunakan S3." },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Konfigurasi storage tidak valid.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let body: PresignBody;
  try {
    body = (await req.json()) as PresignBody;
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const docType = String(body.docType || "") as DocType;
  if (!docType || !Object.values(DocType).includes(docType)) {
    return NextResponse.json({ error: "Jenis dokumen tidak valid." }, { status: 400 });
  }

  const fileName = String(body.fileName || "").trim();
  const mimeType = String(body.mimeType || "").trim();
  const size = Number(body.size || 0);

  if (!fileName) {
    return NextResponse.json({ error: "Nama file tidak valid." }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(mimeType)) {
    return NextResponse.json({ error: "Format file tidak didukung." }, { status: 400 });
  }
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "Ukuran file tidak valid." }, { status: 400 });
  }
  if (size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file melebihi 10MB." }, { status: 400 });
  }

  const ext = path.extname(fileName) || ".bin";
  const storedFilename = buildEmployeeStoredFilename(user.name, docType, ext);
  const storagePath = path.join("employee", user.id, docType, storedFilename);
  const storageKey = storagePath.replace(/\\/g, "/");

  const client = getS3Client();
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: storageKey,
      ContentType: mimeType,
    }),
    { expiresIn: PRESIGN_EXPIRY_SECONDS }
  );

  const uploadToken = createUploadToken({
    userId: user.id,
    docType,
    originalFilename: fileName,
    storedFilename,
    storagePath,
    mimeType,
    size,
    exp: Date.now() + TOKEN_EXPIRY_SECONDS * 1000,
  });

  return NextResponse.json({ uploadUrl, uploadToken });
}
