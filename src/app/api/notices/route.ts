import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CERT_KEYWORDS = ["자격증", "시험", "토익", "토플", "컴활", "한국사", "접수", "원서"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const cert = searchParams.get("cert") === "true";
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const notices = cert
    ? await prisma.notice.findMany({
        where: { title: { contains: CERT_KEYWORDS.join("|") } },
        orderBy: { postedAt: "desc" },
      })
    : await prisma.notice.findMany({
        orderBy: { postedAt: "desc" },
        take: all ? undefined : 10,
      });

  return NextResponse.json(
    notices.map((n) => ({ ...n, isNew: n.postedAt > sevenDaysAgo }))
  );
}
