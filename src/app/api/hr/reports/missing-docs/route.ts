import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { DOC_TYPES, DOC_TYPE_LABELS } from "@/lib/constants";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== UserRole.HR) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const employees = await prisma.user.findMany({
    where: { role: UserRole.EMPLOYEE },
    select: { id: true, name: true, email: true },
  });

  const versions = await prisma.documentVersion.findMany({
    select: { userId: true, docType: true },
  });

  const present = new Map<string, Set<string>>();
  versions.forEach((v: { userId: string; docType: string }) => {
    const set = present.get(v.userId) ?? new Set<string>();
    set.add(v.docType);
    present.set(v.userId, set);
  });

  const rows = [
    ["Nama", "Email", "DokumenBelumLengkap"].join(","),
    ...employees.map((emp: { id: string; name: string; email: string | null }) => {
      const existing = present.get(emp.id) ?? new Set<string>();
      const missing = DOC_TYPES.filter((doc) => !existing.has(doc.type)).map(
        (doc) => DOC_TYPE_LABELS[doc.type]
      );
      return [
        `"${emp.name}"`,
        `"${emp.email ?? ""}"`,
        `"${missing.join("; ")}"`,
      ].join(",");
    }),
  ];

  const csv = rows.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="missing-documents.csv"',
    },
  });
}

