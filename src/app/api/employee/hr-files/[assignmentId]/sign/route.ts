import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { decryptFileKeyWithMaster, encryptAesGcm } from "@/lib/crypto";
import { saveFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import path from "path";

export async function POST(
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
  if (!user || user.role !== UserRole.EMPLOYEE) {
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
  if (!assignment || assignment.employeeId !== user.id) {
    return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
  }
  if (assignment.hrFile.fileType !== "AGREEMENT") {
    return NextResponse.json({ error: "Bukan dokumen perjanjian." }, { status: 400 });
  }
  if (assignment.status === "SIGNED") {
    return NextResponse.json({ error: "Dokumen sudah ditandatangani." }, { status: 400 });
  }

  const formData = await req.formData();
  const signedPdf = formData.get("signedPdf");
  if (!(signedPdf instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }
  if (signedPdf.type !== "application/pdf") {
    return NextResponse.json({ error: "Format signed harus PDF." }, { status: 400 });
  }

  const buffer = Buffer.from(await signedPdf.arrayBuffer());

  const fileKey = decryptFileKeyWithMaster(
    Buffer.from(assignment.hrFile.fileKeyEncMaster, "base64"),
    Buffer.from(assignment.hrFile.fileKeyEncMasterIv, "base64")
  );

  const encrypted = encryptAesGcm(buffer, fileKey);
  const storedFilename = `SIGNED-${assignment.id}.pdf`;
  const storagePath = path.join("hr", assignment.hrFileId, storedFilename);
  await saveFile(storagePath, encrypted.ciphertext);

  await prisma.hrFileAssignment.update({
    where: { id: assignment.id },
    data: {
      status: "SIGNED",
      signedAt: new Date(),
      signedFilePath: storagePath,
      signedFileIv: encrypted.iv.toString("base64"),
      signedStoredFilename: storedFilename,
    },
  });

  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "SIGN_AGREEMENT",
    targetType: "HrFileAssignment",
    targetId: assignment.id,
  });

  return NextResponse.json({ ok: true });
}
