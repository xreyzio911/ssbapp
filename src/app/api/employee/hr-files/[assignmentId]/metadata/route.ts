import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

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

  return NextResponse.json({
    fileIv: assignment.hrFile.fileIv,
    fileKeyEncPassword: assignment.fileKeyEncPassword,
    passwordKdfSalt: assignment.passwordKdfSalt,
    passwordKdfIterations: assignment.passwordKdfIterations,
    passwordKdfIv: assignment.passwordKdfIv,
  });
}
