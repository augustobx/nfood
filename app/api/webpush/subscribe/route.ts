import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, orderId, clientId } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    // Buscamos si ya existe el endpoint
    const existingSub = await prisma.pushSubscription.findFirst({
      where: { endpoint: subscription.endpoint }
    });

    if (existingSub) {
      // Si existe, lo actualizamos
      await prisma.pushSubscription.update({
        where: { id: existingSub.id },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          orderId: orderId || null,
          clientId: clientId || null,
        }
      });
    } else {
      // Si no existe, lo creamos
      await prisma.pushSubscription.create({
        data: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          orderId: orderId || null,
          clientId: clientId || null,
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}