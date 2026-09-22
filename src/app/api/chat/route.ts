import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chat } from "@/lib/claude";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { message, history = [] } = await req.json();
  if (!message)
    return NextResponse.json({ error: "메시지 없음" }, { status: 400 });

  const answer = await chat(message, history);

  if (session?.user) {
    const uid = (session.user as any).id as string;
    await prisma.chatLog.createMany({
      data: [
        { uid, message, speaker: "user" },
        { uid, message: answer, speaker: "bot" },
      ],
    });
  }

  return NextResponse.json({ answer });
}
