import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, HrFileType } from "@prisma/client";
import { hasRole } from "@/lib/guards";
import { buildHrStoredFilename } from "@/lib/filename";
import { saveFile } from "@/lib/storage";
import {
  encryptAesGcm,
  encryptFileKeyWithMaster,
  encryptFileKeyWithPassword,
  generateFileKey,
  generateToken,
} from "@/lib/crypto";
import { hashPassword } from "@/lib/password";
import { sendEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import path from "path";
import crypto from "crypto";

const MAX_SIZE = 15 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!hasRole(user, UserRole.HR)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const formData = await req.formData();
  const fileType = String(formData.get("fileType") || "GENERAL") as HrFileType;
  const title = String(formData.get("title") || "").trim();
  const employeeIdsRaw = String(formData.get("employeeIds") || "[]");
  const file = formData.get("file");

  if (!Object.values(HrFileType).includes(fileType)) {
    return NextResponse.json({ error: "Jenis file tidak valid." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Judul dokumen wajib diisi." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file melebihi 15MB." }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Format file tidak didukung." }, { status: 400 });
  }
  if (fileType === "AGREEMENT" && file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Perjanjian harus berupa file PDF." },
      { status: 400 }
    );
  }

  let employeeIds: string[] = [];
  try {
    employeeIds = JSON.parse(employeeIdsRaw);
  } catch {
    return NextResponse.json({ error: "Data karyawan tidak valid." }, { status: 400 });
  }
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    return NextResponse.json({ error: "Pilih minimal satu karyawan." }, { status: 400 });
  }

  const employees = await prisma.user.findMany({
    where: { id: { in: employeeIds }, role: UserRole.EMPLOYEE },
  });
  const missingEmail = employees.filter((emp) => !emp.email);
  if (missingEmail.length > 0) {
    return NextResponse.json(
      { error: "Ada karyawan tanpa email. Mohon lengkapi email sebelum mengirim." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".bin";
  const storedFilename = buildHrStoredFilename(title, ext);
  const hrFileId = crypto.randomUUID();
  const storagePath = path.join("hr", hrFileId, storedFilename);

  const fileKey = generateFileKey();
  const { ciphertext, iv } = encryptAesGcm(buffer, fileKey);
  await saveFile(storagePath, ciphertext);

  const masterWrapped = encryptFileKeyWithMaster(fileKey);

  await prisma.hrFile.create({
    data: {
      id: hrFileId,
      fileType,
      title,
      originalFilename: file.name,
      storedFilename,
      storagePath,
      mimeType: file.type,
      size: file.size,
      fileIv: iv.toString("base64"),
      fileKeyEncMaster: masterWrapped.ciphertext.toString("base64"),
      fileKeyEncMasterIv: masterWrapped.iv.toString("base64"),
      uploadedById: user.id,
    },
  });

  for (const employee of employees) {
    const password = generateToken(12);
    const kdfPayload = encryptFileKeyWithPassword(fileKey, password);
    const passwordHash = await hashPassword(password);

    await prisma.hrFileAssignment.create({
      data: {
        hrFileId,
        employeeId: employee.id,
        passwordHash,
        passwordKdfSalt: kdfPayload.salt.toString("base64"),
        passwordKdfIterations: kdfPayload.iterations,
        passwordKdfIv: kdfPayload.iv.toString("base64"),
        fileKeyEncPassword: kdfPayload.ciphertext.toString("base64"),
      },
    });

    await sendEmail({
      to: employee.email,
      subject: "Dokumen baru dari HR",
      html: `
        <p>Halo ${employee.name},</p>
        <p>Anda menerima dokumen baru: <strong>${title}</strong>.</p>
        <p>Kata sandi dokumen:</p>
        <p><strong>${password}</strong></p>
        <p>Masuk ke portal untuk membuka dokumen.</p>
      `,
    });
  }

  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "UPLOAD_HR_FILE",
    targetType: "HrFile",
    targetId: hrFileId,
    metadata: { fileType, employees: employees.length },
  });

  return NextResponse.json({ ok: true });
}
