import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const messengers = await prisma.messenger.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(messengers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messengers" }, { status: 500 });
  }
}
