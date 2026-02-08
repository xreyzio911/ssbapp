import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, HrFileType } from "@/lib/enums";
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

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];

type UploadMode = "SHARED" | "SPECIFIC";

type SpecificAssignment = {
  index: number;
  employeeId: string;
  title?: string;
};

function stripExtension(name: string) {
  return name.replace(/\.[^/.]+$/, "");
}

function validateFile(file: File, fileType: HrFileType) {
  if (file.size > MAX_SIZE) {
    return "Ukuran file melebihi 10MB.";
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return "Format file tidak didukung.";
  }
  if (fileType === "AGREEMENT" && file.type !== "application/pdf") {
    return "Perjanjian harus berupa file PDF.";
  }
  return null;
}

function getStorageUploadErrorMessage(error: unknown) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Penyimpanan file gagal.";
  if (message.includes("S3 env belum lengkap") || message.includes("S3_BUCKET belum diset")) {
    return "Konfigurasi penyimpanan S3 belum lengkap.";
  }
  return "Gagal menyimpan file ke penyimpanan.";
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!hasRole(user, UserRole.HR)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const loginUrl = `${appUrl}/login`;

  const formData = await req.formData();
  const modeRaw = String(formData.get("mode") || "SHARED").toUpperCase();
  const mode = modeRaw as UploadMode;
  const fileType = String(formData.get("fileType") || "GENERAL") as HrFileType;

  if (!Object.values(HrFileType).includes(fileType)) {
    return NextResponse.json({ error: "Jenis file tidak valid." }, { status: 400 });
  }
  if (mode !== "SHARED" && mode !== "SPECIFIC") {
    return NextResponse.json({ error: "Mode tidak valid." }, { status: 400 });
  }

  if (mode === "SHARED") {
    const title = String(formData.get("title") || "").trim();
    const employeeIdsRaw = String(formData.get("employeeIds") || "[]");
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json(
        { error: "Judul dokumen wajib diisi." },
        { status: 400 }
      );
    }

    const fileError = validateFile(file, fileType);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    let employeeIds: string[] = [];
    try {
      employeeIds = JSON.parse(employeeIdsRaw);
    } catch {
      return NextResponse.json(
        { error: "Data karyawan tidak valid." },
        { status: 400 }
      );
    }
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal satu karyawan." },
        { status: 400 }
      );
    }

    const employees = await prisma.user.findMany({
      where: { id: { in: employeeIds }, role: UserRole.EMPLOYEE },
    });
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".bin";
    const storedFilename = buildHrStoredFilename(title, ext);
    const hrFileId = crypto.randomUUID();
    const storagePath = path.join("hr", hrFileId, storedFilename);

    const fileKey = generateFileKey();
    const { ciphertext, iv } = encryptAesGcm(buffer, fileKey);
    try {
      await saveFile(storagePath, ciphertext);
    } catch (error: unknown) {
      return NextResponse.json(
        { error: getStorageUploadErrorMessage(error) },
        { status: 500 }
      );
    }

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
      const email = employee.email;
      if (!email) {
        continue;
      }
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
        to: email,
        subject: "Dokumen baru dari HR",
        html: `
          <div style="font-family: Arial, sans-serif; color: #1E453E; line-height: 1.6;">
            <p>Halo ${employee.name},</p>
            <p>Anda menerima dokumen baru dari HR:</p>
            <p><strong>${title}</strong></p>
            <p>Silakan masuk ke portal untuk melihat dan mengunduh dokumen.</p>
            <p>
              <a href="${loginUrl}" style="display: inline-block; padding: 10px 18px; border-radius: 999px; background: #1E453E; color: #ffffff; text-decoration: none; font-weight: 600;">
                Masuk ke Portal
              </a>
            </p>
            <p style="font-size: 12px; color: #6c6f6e;">
              Jika tombol tidak berfungsi, buka tautan berikut:
              <a href="${loginUrl}" style="color: #1E453E;">${loginUrl}</a>
            </p>
            <p style="font-size: 12px; color: #6c6f6e;">
              Jika Anda tidak merasa menerima dokumen ini, Anda dapat mengabaikan email ini.
            </p>
          </div>
        `,
      });
    }

    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "UPLOAD_HR_FILE",
      targetType: "HrFile",
      targetId: hrFileId,
      metadata: { fileType, employees: employees.length, mode: "SHARED" },
    });

    return NextResponse.json({ ok: true });
  }

  const assignmentsRaw = String(formData.get("assignments") || "[]");
  const files = formData.getAll("files");

  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }

  let assignments: SpecificAssignment[] = [];
  try {
    const parsed = JSON.parse(assignmentsRaw);
    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: "Data pairing tidak valid." },
        { status: 400 }
      );
    }
    assignments = parsed.map((item: SpecificAssignment) => ({
      index: Number(item.index),
      employeeId: String(item.employeeId || ""),
      title: typeof item.title === "string" ? item.title : "",
    }));
  } catch {
    return NextResponse.json(
      { error: "Data pairing tidak valid." },
      { status: 400 }
    );
  }

  if (assignments.length !== files.length) {
    return NextResponse.json(
      { error: "Jumlah pairing tidak sesuai dengan jumlah file." },
      { status: 400 }
    );
  }

  const assignmentByIndex = new Map<number, SpecificAssignment>();
  for (const assignment of assignments) {
    if (!Number.isInteger(assignment.index)) {
      return NextResponse.json(
        { error: "Data pairing tidak valid." },
        { status: 400 }
      );
    }
    if (assignment.index < 0 || assignment.index >= files.length) {
      return NextResponse.json(
        { error: "Data pairing tidak valid." },
        { status: 400 }
      );
    }
    if (!assignment.employeeId) {
      return NextResponse.json(
        { error: "Semua file harus dipasangkan ke karyawan." },
        { status: 400 }
      );
    }
    if (assignmentByIndex.has(assignment.index)) {
      return NextResponse.json(
        { error: "Data pairing tidak valid." },
        { status: 400 }
      );
    }
    assignmentByIndex.set(assignment.index, assignment);
  }

  const employeeIds = Array.from(
    new Set(assignments.map((assignment) => assignment.employeeId))
  );

  const employees = await prisma.user.findMany({
    where: { id: { in: employeeIds }, role: UserRole.EMPLOYEE },
    select: { id: true, name: true, email: true },
  });

  if (employees.length !== employeeIds.length) {
    return NextResponse.json(
      { error: "Data karyawan tidak valid." },
      { status: 400 }
    );
  }


  const employeeById = new Map<
    string,
    { id: string; name: string; email: string | null }
  >();
  employees.forEach(
    (employee: { id: string; name: string; email: string | null }) => {
      employeeById.set(employee.id, employee);
    }
  );

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File tidak ditemukan." },
        { status: 400 }
      );
    }

    const assignment = assignmentByIndex.get(index);
    if (!assignment) {
      return NextResponse.json(
        { error: "Data pairing tidak valid." },
        { status: 400 }
      );
    }

    const employee = employeeById.get(assignment.employeeId);
    if (!employee) {
      return NextResponse.json(
        { error: "Data karyawan tidak valid." },
        { status: 400 }
      );
    }

    const fileError = validateFile(file, fileType);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    const fallbackTitle = stripExtension(file.name) || file.name;
    const finalTitle = assignment.title?.trim() || fallbackTitle;

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".bin";
    const storedFilename = buildHrStoredFilename(finalTitle, ext);
    const hrFileId = crypto.randomUUID();
    const storagePath = path.join("hr", hrFileId, storedFilename);

    const fileKey = generateFileKey();
    const { ciphertext, iv } = encryptAesGcm(buffer, fileKey);
    try {
      await saveFile(storagePath, ciphertext);
    } catch (error: unknown) {
      return NextResponse.json(
        { error: getStorageUploadErrorMessage(error) },
        { status: 500 }
      );
    }

    const masterWrapped = encryptFileKeyWithMaster(fileKey);

    await prisma.hrFile.create({
      data: {
        id: hrFileId,
        fileType,
        title: finalTitle,
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

    const email = employee.email;

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

    if (email) {
      await sendEmail({
        to: email,
        subject: "Dokumen baru dari HR",
        html: `
          <div style="font-family: Arial, sans-serif; color: #1E453E; line-height: 1.6;">
            <p>Halo ${employee.name},</p>
            <p>Anda menerima dokumen baru dari HR:</p>
            <p><strong>${finalTitle}</strong></p>
            <p>Silakan masuk ke portal untuk melihat dan mengunduh dokumen.</p>
            <p>
              <a href="${loginUrl}" style="display: inline-block; padding: 10px 18px; border-radius: 999px; background: #1E453E; color: #ffffff; text-decoration: none; font-weight: 600;">
                Masuk ke Portal
              </a>
            </p>
            <p style="font-size: 12px; color: #6c6f6e;">
              Jika tombol tidak berfungsi, buka tautan berikut:
              <a href="${loginUrl}" style="color: #1E453E;">${loginUrl}</a>
            </p>
            <p style="font-size: 12px; color: #6c6f6e;">
              Jika Anda tidak merasa menerima dokumen ini, Anda dapat mengabaikan email ini.
            </p>
          </div>
        `,
      });
    }

    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "UPLOAD_HR_FILE",
      targetType: "HrFile",
      targetId: hrFileId,
      metadata: { fileType, employees: 1, mode: "SPECIFIC" },
    });
  }

  return NextResponse.json({ ok: true });
}
