import { clearSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await clearSession();
  return NextResponse.redirect(new URL("/login", req.url));
}

export async function GET(req: Request) {
  return NextResponse.redirect(new URL("/login", req.url));
}
