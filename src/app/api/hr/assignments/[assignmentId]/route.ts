import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { decryptFileKeyWithMaster, decryptAesGcm } from "@/lib/crypto";
import { readFileBuffer } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: Request,
<<<<<<< HEAD
  { params }: { params: { assignmentId: string } }
) {
=======
  context: { params: Promise<{ assignmentId: string }> }
) {
  const { assignmentId } = await context.params;
>>>>>>> b330d54 (Fix route handler params for Next 16)
  const user = await getSessionUser();
  if (!user || user.role !== UserRole.HR) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const assignment = await prisma.hrFileAssignment.findUnique({
<<<<<<< HEAD
    where: { id: params.assignmentId },
=======
    where: { id: assignmentId },
>>>>>>> b330d54 (Fix route handler params for Next 16)
    include: { hrFile: true },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
  }

  const url = new URL(req.url);
  const signed = url.searchParams.get("signed") === "1";

  if (signed && !assignment.signedFilePath) {
    return NextResponse.json({ error: "File signed belum tersedia." }, { status: 400 });
  }

  const fileKey = decryptFileKeyWithMaster(
    Buffer.from(assignment.hrFile.fileKeyEncMaster, "base64"),
    Buffer.from(assignment.hrFile.fileKeyEncMasterIv, "base64")
  );

  const filePath = signed ? assignment.signedFilePath! : assignment.hrFile.storagePath;
  const iv = signed
    ? assignment.signedFileIv!
    : assignment.hrFile.fileIv;
  const encrypted = await readFileBuffer(filePath);
  const plaintext = decryptAesGcm(
    encrypted,
    fileKey,
    Buffer.from(iv, "base64")
  );

  const filename = signed
    ? assignment.signedStoredFilename || "signed.pdf"
    : assignment.hrFile.storedFilename;

  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    action: signed ? "DOWNLOAD_HR_SIGNED" : "DOWNLOAD_HR_FILE",
    targetType: "HrFileAssignment",
    targetId: assignment.id,
  });

  return new Response(plaintext, {
    headers: {
      "Content-Type": signed ? "application/pdf" : assignment.hrFile.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
