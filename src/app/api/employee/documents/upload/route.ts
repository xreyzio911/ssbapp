import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { DocType, UserRole } from "@prisma/client";
import { hasRole } from "@/lib/guards";
import { buildEmployeeStoredFilename } from "@/lib/filename";
import { saveFile } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import path from "path";

const MAX_SIZE = 15 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!hasRole(user, UserRole.EMPLOYEE)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const formData = await req.formData();
  const docType = String(formData.get("docType") || "") as DocType;
  const file = formData.get("file");

  if (!docType || !Object.values(DocType).includes(docType)) {
    return NextResponse.json({ error: "Jenis dokumen tidak valid." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file melebihi 15MB." }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Format file tidak didukung." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".bin";
  const storedFilename = buildEmployeeStoredFilename(user.name, docType, ext);
  const storagePath = path.join("employee", user.id, docType, storedFilename);

  await saveFile(storagePath, buffer);

  const version = await prisma.documentVersion.create({
    data: {
      userId: user.id,
      docType,
      originalFilename: file.name,
      storedFilename,
      storagePath,
      mimeType: file.type,
      size: file.size,
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
