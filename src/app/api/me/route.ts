import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id, role } = session.user as any;

  if (role === "student") {
    const s = await prisma.student.findUnique({ where: { studentId: id } });
    if (!s) return NextResponse.json({ error: "정보 없음" }, { status: 404 });
    return NextResponse.json([
      ["이름", s.name],
      ["학번", s.studentId],
      ["학과", s.department],
      ["학년", `${s.grade}학년`],
      ["학적 상태", s.status === "ENROLLED" ? "재학" : "휴학"],
    ]);
  }

  const u = await prisma.user.findUnique({ where: { uid: id } });
  if (!u) return NextResponse.json({ error: "정보 없음" }, { status: 404 });
  return NextResponse.json([
    ["이름", u.name],
    ["아이디", u.uid],
    ["소속", u.department],
    ["이메일", u.email],
  ]);
}

// 학생 계정은 학적 데이터라 지우지 않고 대화 기록만 삭제한다.
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id, role } = session.user as any;
  await prisma.chatLog.deleteMany({ where: { uid: id } });
  if (role !== "student") await prisma.user.delete({ where: { uid: id } });
  return NextResponse.json({ ok: true });
}
