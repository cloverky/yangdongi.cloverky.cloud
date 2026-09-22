import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chat } from "@/lib/chatbot";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { message } = await req.json();
  if (!message)
    return NextResponse.json({ error: "메시지 없음" }, { status: 400 });

  const user = session?.user as any;
  const studentId = user?.role === "student" ? (user?.id as string) : undefined;
  const answer = await chat(message, studentId);

  if (user) {
    await prisma.chatLog.createMany({
      data: [
        { uid: user.id, message, speaker: "user" },
        { uid: user.id, message: answer, speaker: "bot" },
      ],
    });
  }

  return NextResponse.json({ answer });
}
