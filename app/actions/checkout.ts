"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

    // Determine delivery time for now just set it to "ASAP" or what user supplied
    const deliveryTime = data.deliveryTime || "Lo antes posible";
    
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
        items: {
          create: items.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            notes: item.notes,
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
            }
          }))
        },
        history: {
          create: {
            status: "NEW"
          }
        }
      }
    });

    revalidatePath("/admin/live");

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Order creation failed:", error);
    return { success: false, error: "Error al crear el pedido" };
  }
}
