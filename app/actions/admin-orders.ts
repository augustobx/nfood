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
