"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateConfig(id: string, data: any) {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { id } });
    
    // If opening store, reset time slots capacities
    if (config && !config.isStoreOpen && data.isStoreOpen === true) {
      const slots = await prisma.deliveryTimeSlot.findMany();
      for (const slot of slots) {
        await prisma.deliveryTimeSlot.update({
          where: { id: slot.id },
          data: { available: slot.capacity }
        });
      }
    }

    await prisma.systemConfig.update({ where: { id }, data });
    revalidatePath("/admin/settings");
    revalidatePath("/admin/live");
    revalidatePath("/"); // Update storefront state
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar la configuración" };
  }
}

export async function addDeliverySlot(data: { time: string; capacity: number }) {
  try {
    const slot = await prisma.deliveryTimeSlot.create({
      data: {
        time: data.time,
        capacity: data.capacity,
        available: data.capacity, // Initially full
        isActive: true,
      }
    });
    revalidatePath("/admin/settings");
    return { success: true, slot };
  } catch (error) {
    return { success: false, error: "Error al agregar horario" };
  }
}

export async function toggleDeliverySlot(id: string, isActive: boolean) {
  try {
    await prisma.deliveryTimeSlot.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar horario" };
  }
}

export async function updateSlotAvailable(id: string, delta: number) {
  try {
    const slot = await prisma.deliveryTimeSlot.findUnique({ where: { id } });
    if (!slot) throw new Error("Slot missing");
    
    // Calculate new but don't exceed max capacity? Actually let them exceed if they want manually
    const newAvailable = Math.max(0, slot.available + delta);
    
    await prisma.deliveryTimeSlot.update({
      where: { id },
      data: { available: newAvailable }
    });
    revalidatePath("/admin/live");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al modificar cupos" };
  }
}

export async function deleteDeliverySlot(id: string) {
  try {
    await prisma.deliveryTimeSlot.delete({ where: { id } });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar horario" };
  }
}

export async function addMessenger(data: { name: string; phone: string }) {
  try {
    const m = await prisma.messenger.create({ data: { ...data, isActive: true } });
    revalidatePath("/admin/settings");
    revalidatePath("/admin/live");
    return { success: true, messenger: m };
  } catch (error) {
    return { success: false, error: "Error al agregar mensajero" };
  }
}

export async function toggleMessenger(id: string, isActive: boolean) {
  try {
    await prisma.messenger.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/settings");
    revalidatePath("/admin/live");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar mensajero" };
  }
}
