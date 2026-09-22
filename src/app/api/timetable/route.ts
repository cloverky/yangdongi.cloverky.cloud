import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "2025");
  const semester = parseInt(searchParams.get("semester") ?? "1");
  const studentId = (session.user as any).id as string;

  const enrollments = await prisma.studentClass.findMany({
    where: { studentId, year, semester },
    include: { class: true },
  });

  return NextResponse.json(enrollments.map((e) => e.class));
}
