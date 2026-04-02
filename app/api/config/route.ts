import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = await prisma.systemConfig.findFirst();
    if (!config) {
      const newConfig = await prisma.systemConfig.create({
        data: {
          appName: "nfood",
          whatsappMessage: "Hola, tu pedido está en estado: {{estado}}. Gracias por elegirnos!",
          isStoreOpen: true
        }
      });
      return NextResponse.json(newConfig);
    }
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}
