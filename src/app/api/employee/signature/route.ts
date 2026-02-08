import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { saveFile, readFileBuffer } from "@/lib/storage";
import path from "path";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME = ["image/png", "image/jpeg"];

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== UserRole.EMPLOYEE) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { signaturePath: true, signatureMime: true },
  });
  if (!record?.signaturePath || !record.signatureMime) {
    return NextResponse.json({ error: "Tanda tangan belum tersedia." }, { status: 404 });
  }

  const buffer = await readFileBuffer(record.signaturePath);
  const body = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": record.signatureMime,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== UserRole.EMPLOYEE) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("signature");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Format tanda tangan harus PNG/JPG." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran tanda tangan maksimal 2MB." }, { status: 400 });
  }

  const ext = path.extname(file.name) || (file.type === "image/png" ? ".png" : ".jpg");
  const storedFilename = `signature${ext}`;
  const storagePath = path.join("signatures", user.id, storedFilename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await saveFile(storagePath, buffer);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      signaturePath: storagePath,
      signatureFilename: file.name,
      signatureMime: file.type,
      signatureUpdatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
