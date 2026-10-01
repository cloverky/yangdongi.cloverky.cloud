import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { uid, name, department, email, password } = await req.json();
  if (!uid || !name || !password)
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });

  // 로그인은 User 를 Student 보다 먼저 찾으므로, 학생 학번으로 가입되면 그 학번을 가로챌 수 있다
  const [exists, student] = await Promise.all([
    prisma.user.findUnique({ where: { uid } }),
    prisma.student.findUnique({ where: { studentId: uid } }),
  ]);
  if (student)
    return NextResponse.json({ error: "이미 등록된 학번이에요. 학번으로 바로 로그인해 주세요." }, { status: 409 });
  if (exists)
    return NextResponse.json({ error: "이미 사용 중인 아이디예요." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { uid, name, department: department ?? "", email: email ?? "", passwordHash },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
