"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        history: {
          create: {
            status: newStatus
          }
        }
      }
    });
    
    revalidatePath("/admin/live");
    revalidatePath(`/track/${order.id}`);
    return { success: true, order };
  } catch (error) {
    return { success: false, error: "Error actualizando estado" };
  }
}

export async function assignMessenger(orderId: string, messengerId: string | null) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { messengerId }
    });
    
    revalidatePath("/admin/live");
    revalidatePath(`/track/${order.id}`);
    return { success: true, order };
  } catch (error) {
    return { success: false, error: "Error asignando mensajero" };
  }
}

export async function dispatchMessengerRoadmap(messengerId: string) {
  try {
    const orders = await prisma.order.findMany({
       where: { 
         messengerId, 
         status: "PENDING_DELIVERY"
       },
       orderBy: { createdAt: 'asc' }
    });

    if (orders.length === 0) return { success: false, error: "No hay pedidos pendientes para este cadete" };

    // Format WA Message
    let text = `*Hoja de Ruta - ${orders.length} pedidos*\n\n`;
    orders.forEach((o, i) => {
       const hasToPay = o.paymentMethod === "CASH" ? "A COBRAR: $" + o.total.toLocaleString('es-AR') : "YA PAGADO (MercadoPago)";
       text += `📦 *Pedido #${o.id.slice(-5).toUpperCase()}*\n`;
       text += `📍 Direc: ${o.deliveryAddress}\n`;
       text += `👤 Cliente: ${o.clientName} (${o.clientPhone})\n`;
       text += `💰 ${hasToPay}\n`;
       text += `----------------------\n`;
    });
    text += `\nTotal Envíos Múltiples: ${orders.length}`;

    // Update them all to DELIVERED
    await prisma.order.updateMany({
       where: { id: { in: orders.map(x => x.id) } },
       data: { status: "DELIVERED" }
    });

    for (const o of orders) {
      await prisma.orderHistory.create({
         data: { orderId: o.id, status: "DELIVERED" }
      });
    }

    revalidatePath("/admin/live");

    return { success: true, text };
  } catch (err) {
    return { success: false, error: "Error al despachar hoja de ruta" };
  }
}
