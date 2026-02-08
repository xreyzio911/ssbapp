import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { readFileBuffer } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { buildEmployeeStoredFilename } from "@/lib/filename";
import path from "path";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ versionId: string }> }
) {
  const { versionId } = await context.params;
  const preview = req.nextUrl.searchParams.get("preview") === "1";
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

  let buffer: Uint8Array;
  try {
    buffer = await readFileBuffer(version.storagePath);
  } catch (error: unknown) {
    const maybeFsError = error as { code?: string };
    if (maybeFsError.code === "ENOENT") {
      return NextResponse.json(
        {
          error:
            "File fisik tidak ditemukan di penyimpanan. Periksa konfigurasi STORAGE_DRIVER/S3.",
        },
        { status: 404 }
      );
    }
    throw error;
  }
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
    action: preview ? "PREVIEW_EMPLOYEE_DOC" : "DOWNLOAD_EMPLOYEE_DOC",
    targetType: "DocumentVersion",
    targetId: version.id,
  });
  const body = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": version.mimeType,
      "Content-Disposition": preview
        ? `inline; filename="${downloadName}"`
        : `attachment; filename="${downloadName}"`,
    },
  });
}

