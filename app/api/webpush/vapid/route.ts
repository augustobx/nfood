import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

export async function GET() {
  try {
    let config = await prisma.systemConfig.findFirst();
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {}
      });
    }

    if (!config.vapidPublicKey || !config.vapidPrivateKey) {
      const vapidKeys = webpush.generateVAPIDKeys();
      config = await prisma.systemConfig.update({
        where: { id: config.id },
        data: {
          vapidPublicKey: vapidKeys.publicKey,
          vapidPrivateKey: vapidKeys.privateKey,
        }
      });
    }

    return NextResponse.json({ publicKey: config.vapidPublicKey });
  } catch (error) {
    console.error("VAPID config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
