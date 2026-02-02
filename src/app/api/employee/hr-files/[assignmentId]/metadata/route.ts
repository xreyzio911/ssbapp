import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(
  _req: Request,
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

  return NextResponse.json({
    fileIv: assignment.hrFile.fileIv,
    fileKeyEncPassword: assignment.fileKeyEncPassword,
    passwordKdfSalt: assignment.passwordKdfSalt,
    passwordKdfIterations: assignment.passwordKdfIterations,
    passwordKdfIv: assignment.passwordKdfIv,
  });
}
