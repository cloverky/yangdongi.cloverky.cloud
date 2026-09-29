import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const logs = await prisma.chatLog.findMany({
    where: { uid: (session.user as any).id, createdAt: { gte: new Date(Date.now() - 7 * 86400_000) } },
    orderBy: { id: "asc" },
    select: { id: true, message: true, speaker: true, createdAt: true },
  });
  return NextResponse.json(logs);
}

/** body.ids 가 있으면 그 메시지만, 없으면 내 대화 전체를 삭제한다. */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { ids } = await req.json().catch(() => ({}));
  await prisma.chatLog.deleteMany({
    where: { uid: (session.user as any).id, ...(Array.isArray(ids) ? { id: { in: ids.map(Number) } } : {}) },
  });
  return NextResponse.json({ ok: true });
}
