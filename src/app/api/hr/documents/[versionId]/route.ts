import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { readFileBuffer } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { buildEmployeeStoredFilename } from "@/lib/filename";
import path from "path";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ versionId: string }> }
) {
  const { versionId } = await context.params;
  const user = await getSessionUser();
  if (!user || user.role !== UserRole.HR) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId },
    include: { user: true },
  });
  if (!version) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
  }

  const buffer = await readFileBuffer(version.storagePath);
  const ext =
    path.extname(version.storedFilename || version.originalFilename || "") || ".bin";
  const downloadName = buildEmployeeStoredFilename(
    version.user.name,
    version.docType,
    ext,
    version.createdAt
  );
  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "DOWNLOAD_EMPLOYEE_DOC",
    targetType: "DocumentVersion",
    targetId: version.id,
  });
  return new Response(buffer, {
    headers: {
      "Content-Type": version.mimeType,
      "Content-Disposition": `attachment; filename="${downloadName}"`,
    },
  });
}

