import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.5, A: 4.0, "B+": 3.5, B: 3.0,
  "C+": 2.5, C: 2.0, "D+": 1.5, D: 1.0, F: 0,
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const studentId = (session.user as any).id as string;
  const { searchParams } = new URL(req.url);
  const detail = searchParams.get("detail") === "true";

  const enrollments = await prisma.studentClass.findMany({
    where: { studentId },
    include: { class: true },
    orderBy: [{ year: "asc" }, { semester: "asc" }],
  });

  if (detail) {
    const bySemester: Record<string, any[]> = {};
    for (const e of enrollments) {
      const key = `${e.year}-${e.semester}`;
      if (!bySemester[key]) bySemester[key] = [];
      bySemester[key].push({
        subject: e.class.subject,
        credit: e.class.credit,
        grade: e.grade,
        gradePoint: e.grade ? (GRADE_POINTS[e.grade] ?? null) : null,
      });
    }
    return NextResponse.json(bySemester);
  }

  type Enrollment = (typeof enrollments)[number];
  const totalCredits = enrollments.reduce((s: number, e: Enrollment) => s + (e.grade && e.grade !== "F" ? e.class.credit : 0), 0);
  const graded = enrollments.filter((e: Enrollment) => e.grade && e.grade in GRADE_POINTS);
  const gpa =
    graded.length === 0
      ? 0
      : graded.reduce((s: number, e: Enrollment) => s + (GRADE_POINTS[e.grade!] ?? 0) * e.class.credit, 0) /
        graded.reduce((s: number, e: Enrollment) => s + e.class.credit, 0);

  return NextResponse.json({ totalCredits, gpa: Math.round(gpa * 100) / 100, subjectCount: enrollments.length });
}
