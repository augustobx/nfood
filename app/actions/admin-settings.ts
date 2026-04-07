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

// NUEVA FUNCIÓN PARA ENVÍO MASIVO / PRUEBAS PUSH
export async function broadcastPushNotification(title: string, body: string, url: string = "/") {
  try {
    const config = await prisma.systemConfig.findFirst();
    if (!config?.vapidPublicKey || !config?.vapidPrivateKey) {
      return { success: false, error: "Las claves VAPID no están configuradas en el sistema." };
    }

    const webpush = require("web-push");
    webpush.setVapidDetails(
      process.env.BASE_URL || 'mailto:soporte@nanolabs.online',
      config.vapidPublicKey,
      config.vapidPrivateKey
    );

    // Obtener todas las suscripciones únicas de la base de datos
    const subscriptions = await prisma.pushSubscription.findMany();

    if (subscriptions.length === 0) {
      return { success: false, error: "No hay ningún dispositivo suscrito a las notificaciones." };
    }

    const payload = JSON.stringify({ title, body, url });
    let successCount = 0;
    let failCount = 0;

    // Disparar en paralelo usando Promise.allSettled para mayor velocidad
    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { auth: sub.auth, p256dh: sub.p256dh }
        }, payload);
        successCount++;
      } catch (pushErr: any) {
        failCount++;
        // Si el dispositivo ya no existe o revocó el permiso, lo borramos de la DB
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    });

    await Promise.allSettled(pushPromises);

    return {
      success: true,
      message: `Enviado a ${successCount} dispositivos. (${failCount} suscripciones inactivas eliminadas).`
    };
  } catch (error) {
    console.error("Broadcast Push Error:", error);
    return { success: false, error: "Error interno al procesar el envío masivo." };
  }
}