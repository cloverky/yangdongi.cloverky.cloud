import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject");
  const dueSoon = searchParams.get("due_soon") === "true";

  if (dueSoon) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 30);
    const assignments = await prisma.assignment.findMany({
      where: { dueDate: { lte: threshold, gte: new Date() } },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json(assignments);
  }

  if (subject) {
    const assignments = await prisma.assignment.findMany({
      where: { subjectName: subject },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json(assignments);
  }

  const assignments = await prisma.assignment.findMany({ orderBy: { dueDate: "asc" } });
  return NextResponse.json(assignments);
}
