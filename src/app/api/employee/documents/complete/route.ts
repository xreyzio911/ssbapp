import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { DocType, UserRole } from "@/lib/enums";
import { hasRole } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getS3Bucket, getS3Client, getStorageDriver } from "@/lib/storage";
import { verifyUploadToken } from "@/lib/upload-token";
import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];

type CompleteBody = {
  uploadToken: string;
};

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!hasRole(user, UserRole.EMPLOYEE)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  if (getStorageDriver() !== "s3") {
    return NextResponse.json({ error: "STORAGE_NOT_S3" }, { status: 409 });
  }

  let body: CompleteBody;
  try {
    body = (await req.json()) as CompleteBody;
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const uploadToken = String(body.uploadToken || "");
  if (!uploadToken) {
    return NextResponse.json({ error: "Token upload tidak valid." }, { status: 400 });
  }

  const payload = verifyUploadToken(uploadToken);
  if (!payload) {
    return NextResponse.json({ error: "Token upload tidak valid." }, { status: 400 });
  }
  if (payload.userId !== user.id) {
    return NextResponse.json({ error: "Token upload tidak valid." }, { status: 403 });
  }
  if (payload.exp < Date.now()) {
    return NextResponse.json({ error: "Token upload sudah kedaluwarsa." }, { status: 400 });
  }

  const docType = payload.docType as DocType;
  if (!Object.values(DocType).includes(docType)) {
    return NextResponse.json({ error: "Jenis dokumen tidak valid." }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(payload.mimeType)) {
    return NextResponse.json({ error: "Format file tidak didukung." }, { status: 400 });
  }
  if (!Number.isFinite(payload.size) || payload.size <= 0) {
    return NextResponse.json({ error: "Ukuran file tidak valid." }, { status: 400 });
  }
  if (payload.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file melebihi 10MB." }, { status: 400 });
  }

  const storageKey = payload.storagePath.replace(/\\/g, "/");
  if (!storageKey.startsWith(`employee/${user.id}/`)) {
    return NextResponse.json({ error: "Token upload tidak valid." }, { status: 400 });
  }

  const client = getS3Client();
  const bucket = getS3Bucket();
  try {
    const head = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      })
    );
    if (head.ContentLength !== payload.size) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: storageKey,
        })
      );
      return NextResponse.json({ error: "Ukuran file tidak sesuai." }, { status: 400 });
    }
    if (head.ContentType && head.ContentType !== payload.mimeType) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: storageKey,
        })
      );
      return NextResponse.json({ error: "Format file tidak didukung." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "File belum tersedia." }, { status: 400 });
  }

  const version = await prisma.documentVersion.create({
    data: {
      userId: user.id,
      docType,
      originalFilename: payload.originalFilename,
      storedFilename: payload.storedFilename,
      storagePath: payload.storagePath,
      mimeType: payload.mimeType,
      size: payload.size,
      uploadedByRole: user.role,
    },
  });

  await prisma.employeeDocStatus.upsert({
    where: { userId_docType: { userId: user.id, docType } },
    create: { userId: user.id, docType, needsUpdate: false },
    update: { needsUpdate: false },
  });

  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "UPLOAD_EMPLOYEE_DOC",
    targetType: "DocumentVersion",
    targetId: version.id,
    metadata: { docType },
  });

  return NextResponse.json({ ok: true });
}
