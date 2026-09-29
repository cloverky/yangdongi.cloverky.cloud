import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const logs = await prisma.chatLog.findMany({
    where: { uid: (session.user as any).id, createdAt: { gte: new Date(Date.now() - 7 * 86400_000) } },
    orderBy: { id: "asc" },
    select: { message: true, speaker: true, createdAt: true },
  });
  return NextResponse.json(logs);
}
