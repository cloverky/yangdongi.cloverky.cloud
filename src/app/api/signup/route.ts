import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { uid, name, department, email, password } = await req.json();
  if (!uid || !name || !password)
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { uid } });
  if (exists)
    return NextResponse.json({ error: "이미 사용 중인 아이디" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { uid, name, department: department ?? "", email: email ?? "", passwordHash },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
