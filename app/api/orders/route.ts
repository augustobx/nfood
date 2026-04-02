import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        // Fetch all orders except DELIVERED and CANCELLED, or keep them for today
        // For dashboard we probably want today's orders or active ones
        createdAt: {
          gte: new Date(new Date().setHours(0,0,0,0))
        }
      },
      include: {
        items: {
          include: {
            product: true,
            addedExtras: { include: { extra: true } },
            removedIngredients: { include: { ingredient: true } }
          }
        },
        messenger: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
