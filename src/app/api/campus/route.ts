import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const places = await prisma.campusPlace.findMany();
  return NextResponse.json(places);
}
