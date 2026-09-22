import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (name) {
    const detail = await prisma.departmentDetail.findUnique({ where: { name } });
    return NextResponse.json(detail ?? { error: "없음" }, { status: detail ? 200 : 404 });
  }

  const departments = await prisma.department.findMany({ include: { faculty: true } });
  return NextResponse.json(departments);
}
