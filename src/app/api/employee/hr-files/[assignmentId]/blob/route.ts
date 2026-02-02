import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { readFileBuffer } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

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
  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "DOWNLOAD_HR_FILE_ENC",
    targetType: "HrFileAssignment",
    targetId: assignment.id,
  });
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": buffer.length.toString(),
    },
  });
}

