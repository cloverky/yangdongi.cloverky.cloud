import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

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
  ]);
}

/**
 * 내 정보 수정. 이름·소속은 회원가입 계정만(학생은 학적 데이터라 불가),
 * 비밀번호는 현재 비밀번호 확인 후 누구나 바꿀 수 있다.
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  const { id, role } = session.user as any;
  const { name, department, currentPassword, newPassword } = await req.json();
  const isStudent = role === "student";

  if (newPassword !== undefined) {
    if (typeof newPassword !== "string" || newPassword.length < 4)
      return NextResponse.json({ error: "새 비밀번호는 4자 이상이어야 해요." }, { status: 400 });
    const hash = isStudent
      ? (await prisma.student.findUnique({ where: { studentId: id } }))?.pw
      : (await prisma.user.findUnique({ where: { uid: id } }))?.passwordHash;
    if (!hash || !(await bcrypt.compare(String(currentPassword ?? ""), hash)))
      return NextResponse.json({ error: "현재 비밀번호가 맞지 않아요." }, { status: 400 });
    const next = await bcrypt.hash(newPassword, 12);
    if (isStudent) await prisma.student.update({ where: { studentId: id }, data: { pw: next } });
    else await prisma.user.update({ where: { uid: id }, data: { passwordHash: next } });
    return NextResponse.json({ ok: true });
  }

  if (isStudent) return NextResponse.json({ error: "학생 정보는 학교 학적 정보라 여기서 바꿀 수 없어요." }, { status: 403 });
  if (!String(name ?? "").trim()) return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
  await prisma.user.update({ where: { uid: id }, data: { name: String(name).trim(), department: String(department ?? "") } });
  return NextResponse.json({ ok: true });
}

// 학생 계정은 학적 데이터라 탈퇴(삭제) 불가
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id, role } = session.user as any;
  if (role === "student") return NextResponse.json({ error: "학생 계정은 탈퇴할 수 없어요" }, { status: 403 });
  await prisma.chatLog.deleteMany({ where: { uid: id } });
  await prisma.user.delete({ where: { uid: id } });
  return NextResponse.json({ ok: true });
}
