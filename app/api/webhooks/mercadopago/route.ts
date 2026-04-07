import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Payment } from "mercadopago";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Mercado Pago sends "payment" events. Listen to them.
    if (body.type === "payment" && body.data?.id) {
      const config = await prisma.systemConfig.findFirst();
      if (!config?.mpAccessToken) {
        return NextResponse.json({ error: "MP not configured" }, { status: 500 });
      }

      const client = new MercadoPagoConfig({ accessToken: config.mpAccessToken });
      const payment = new Payment(client);

      const paymentInfo = await payment.get({ id: body.data.id });

      if (paymentInfo.external_reference) {
        // Here we map the MP payment status to our internal model
        let newStatus = "PENDING";
        if (paymentInfo.status === "approved") {
           newStatus = "PAID";
        } else if (paymentInfo.status === "rejected" || paymentInfo.status === "cancelled") {
           newStatus = "FAILED";
        }

        // Update the order in our database
        await prisma.order.update({
          where: { id: paymentInfo.external_reference },
          data: { paymentStatus: newStatus }
        });
        
        console.log(`[Webhook] Order ${paymentInfo.external_reference} updated to ${newStatus}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MP Webhook Error]:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }
}
