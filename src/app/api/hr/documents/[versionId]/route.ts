import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { readFileBuffer } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export async function GET(
  _req: Request,
<<<<<<< HEAD
  { params }: { params: { versionId: string } }
) {
=======
  context: { params: Promise<{ versionId: string }> }
) {
  const { versionId } = await context.params;
>>>>>>> b330d54 (Fix route handler params for Next 16)
  const user = await getSessionUser();
  if (!user || user.role !== UserRole.HR) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const version = await prisma.documentVersion.findUnique({
<<<<<<< HEAD
    where: { id: params.versionId },
=======
    where: { id: versionId },
>>>>>>> b330d54 (Fix route handler params for Next 16)
  });
  if (!version) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
  }

  const buffer = await readFileBuffer(version.storagePath);
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
      "Content-Disposition": `attachment; filename="${version.storedFilename}"`,
    },
  });
}
