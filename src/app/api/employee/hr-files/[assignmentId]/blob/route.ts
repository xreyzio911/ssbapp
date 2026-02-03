import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { readFileBuffer } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { decryptFileKeyWithMaster, decryptAesGcm } from "@/lib/crypto";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const { assignmentId } = await context.params;
  const user = await getSessionUser();
  if (!user || user.role !== UserRole.EMPLOYEE) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const assignment = await prisma.hrFileAssignment.findUnique({
    where: { id: assignmentId },
    include: { hrFile: true },
  });
  if (!assignment || assignment.employeeId !== user.id) {
    return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
  }

  const buffer = await readFileBuffer(assignment.hrFile.storagePath);
  const fileKey = decryptFileKeyWithMaster(
    Buffer.from(assignment.hrFile.fileKeyEncMaster, "base64"),
    Buffer.from(assignment.hrFile.fileKeyEncMasterIv, "base64")
  );
  const plaintext = decryptAesGcm(
    buffer,
    fileKey,
    Buffer.from(assignment.hrFile.fileIv, "base64")
  );
  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "DOWNLOAD_HR_FILE_ENC",
    targetType: "HrFileAssignment",
    targetId: assignment.id,
  });
  return new Response(plaintext, {
    headers: {
      "Content-Type": assignment.hrFile.mimeType,
      "Content-Length": plaintext.length.toString(),
    },
  });
}

