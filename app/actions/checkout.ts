"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getLoggedClient } from "@/lib/auth";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function fetchConfig() {
  const config = await prisma.systemConfig.findFirst();
  return config || null;
}

export async function createOrder(data: any) {
  try {
    const { 
      clientName, 
      clientPhone, 
      needsDelivery, 
      deliveryAddress, 
      paymentMethod,
      items,
      total
    } = data;

    const loggedClient = await getLoggedClient();

    // Calculate points securely
    const productIds = items.map((i: any) => i.product.id);
    const dbProducts = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const pointsMap = new Map(dbProducts.map(p => [p.id, p.points]));

    let earnedPoints = 0;
    for (const item of items) {
      const p = pointsMap.get(item.product.id) || 0;
      earnedPoints += (p * item.quantity);
    }

    // Find the slot by time to decrement it
    const deliveryTime = data.deliveryTime;

    if (deliveryTime) {
      const slot = await prisma.deliveryTimeSlot.findFirst({ where: { time: deliveryTime, isActive: true } });
      if (slot && slot.available > 0) {
        await prisma.deliveryTimeSlot.update({
          where: { id: slot.id },
          data: { available: slot.available - 1 }
        });
      }
    }
    
    // Create the order
    const order = await prisma.order.create({
      data: {
        clientName,
        clientPhone,
        needsDelivery,
        deliveryAddress,
        deliveryTime,
        paymentMethod,
        total,
        status: "NEW",
        paymentStatus: "PENDING",
        clientId: loggedClient?.id || null,
        earnedPoints: earnedPoints,
        items: {
          create: items.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            notes: item.notes,
            isHalfAndHalf: item.isHalfAndHalf || false,
            secondHalfProductId: item.secondHalfProduct?.id || null,
            removedIngredients: {
              create: item.removedIngredients.map((ingId: string) => ({
                ingredientId: ingId
              }))
            },
            addedExtras: {
              create: item.addedExtras.map((extra: any) => ({
                extraId: extra.id,
                price: extra.price
              }))
            },
            comboItems: (item.product.isCombo && item.product.comboItemsConfig?.length > 0) ? {
              create: item.product.comboItemsConfig.map((ci: any) => {
                const removedInThisItem = item.comboRemovedIngredients?.[ci.id] || [];
                return {
                  productId: ci.productId,
                  removedIngredients: {
                    create: removedInThisItem.map((ingId: string) => ({
                      ingredientId: ingId
                    }))
                  }
                };
              })
            } : undefined
          }))
        },
        history: {
          create: {
            status: "NEW"
          }
        }
      }
    });

    if (loggedClient && earnedPoints > 0) {
      await prisma.client.update({
        where: { id: loggedClient.id },
        data: { points: { increment: earnedPoints } }
      });
    }

    revalidatePath("/admin/live");

    let mpInitPoint = undefined;
    if (paymentMethod === "MP") {
      const config = await prisma.systemConfig.findFirst();
      if (config?.mpAccessToken) {
        try {
          const client = new MercadoPagoConfig({ accessToken: config.mpAccessToken, options: { timeout: 5000 } });
          const preference = new Preference(client);
          
          const baseUrl = data.baseUrl || "http://localhost:3000";

          const result = await preference.create({
            body: {
              items: [
                {
                  id: order.id,
                  title: `Pedido en ${config.appName}`,
                  quantity: 1,
                  unit_price: Number(total.toFixed(2))
                }
              ],
              external_reference: order.id,
              back_urls: {
                success: `${baseUrl}/track/${order.id}?status=approved`,
                failure: `${baseUrl}/track/${order.id}?status=failure`,
                pending: `${baseUrl}/track/${order.id}?status=pending`
              },
              auto_return: "approved",
              notification_url: `${baseUrl}/api/webhooks/mercadopago`
            }
          });

          if (result.id && result.init_point) {
            await prisma.order.update({
              where: { id: order.id },
              data: { mpPreferenceId: result.id }
            });
            mpInitPoint = result.init_point;
          }
        } catch (mpError) {
          console.error("MP Preference Error:", mpError);
          // If MP fails, we just don't return initPoint, the order remains PENDING
        }
      }
    }

    return { success: true, orderId: order.id, mpInitPoint };
  } catch (error) {
    console.error("Order creation failed:", error);
    return { success: false, error: "Error al crear el pedido" };
  }
}

export async function cancelOrderFromMP(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order?.paymentMethod === "MP" && order?.paymentStatus === "PENDING" && order?.status !== "CANCELLED") {
       await prisma.order.update({
         where: { id: orderId },
         data: { status: "CANCELLED" }
       });
       revalidatePath("/admin/live");
       return { success: true };
    }
    return { success: false, reason: "NOT_ELIGIBLE" };
  } catch (error) {
    return { success: false };
  }
}
