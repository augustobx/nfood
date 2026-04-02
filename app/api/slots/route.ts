import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const slots = await prisma.deliveryTimeSlot.findMany({
      where: { isActive: true },
      orderBy: { time: 'asc' }
    });
    return NextResponse.json(slots);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load slots" }, { status: 500 });
  }
}
