"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            removedIngredients: true,
            product: { include: { ingredients: true } },
            secondHalfProduct: { include: { ingredients: true } },
            comboItems: {
              include: {
                removedIngredients: true,
                product: { include: { ingredients: true } }
              }
            }
          }
        }
      }
    });

    if (currentOrder && currentOrder.status === "NEW" && newStatus === "IN_PROCESS") {
      for (const item of currentOrder.items) {
        const removedIngIds = item.removedIngredients.map(r => r.ingredientId);
        
        if (item.product.isCombo) {
          for (const ci of item.comboItems) {
            const ciRemovedIds = ci.removedIngredients.map(r => r.ingredientId);
            for (const ing of ci.product.ingredients) {
              if (!ciRemovedIds.includes(ing.ingredientId)) {
                await prisma.ingredient.update({
                  where: { id: ing.ingredientId },
                  data: { stock: { decrement: ing.quantity * item.quantity } }
                });
              }
            }
          }
        } else if (item.isHalfAndHalf && item.secondHalfProduct) {
          for (const ing of item.product.ingredients) {
            if (!removedIngIds.includes(ing.ingredientId)) {
              await prisma.ingredient.update({
                where: { id: ing.ingredientId },
                data: { stock: { decrement: (ing.quantity * item.quantity) / 2 } }
              });
            }
          }
          for (const ing of item.secondHalfProduct.ingredients) {
            if (!removedIngIds.includes(ing.ingredientId)) {
              await prisma.ingredient.update({
                where: { id: ing.ingredientId },
                data: { stock: { decrement: (ing.quantity * item.quantity) / 2 } }
              });
            }
          }
        } else {
          for (const ing of item.product.ingredients) {
            if (!removedIngIds.includes(ing.ingredientId)) {
              await prisma.ingredient.update({
                where: { id: ing.ingredientId },
                data: { stock: { decrement: ing.quantity * item.quantity } }
              });
            }
          }
        }
      }
    }

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

    if (newStatus === "CANCELLED" && currentOrder && currentOrder.clientId && currentOrder.earnedPoints > 0) {
       await prisma.client.update({
          where: { id: currentOrder.clientId },
          data: { points: { decrement: currentOrder.earnedPoints } }
       });
    }
    
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
    let text = `[ Hoja de Ruta - ${orders.length} pedidos ]\n\n`;
    orders.forEach((o, i) => {
       const hasToPay = o.paymentMethod === "CASH" ? "A COBRAR: $" + o.total.toLocaleString('es-AR') : "YA PAGADO (MP)";
       text += `> Pedido #${o.id.slice(-5).toUpperCase()}\n`;
       text += `  Direc: ${o.deliveryAddress}\n`;
       text += `  Cliente: ${o.clientName} (${o.clientPhone})\n`;
       text += `  === ${hasToPay} ===\n`;
       text += `----------------------\n`;
    });
    text += `\nTotal Envios: ${orders.length}`;

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
