"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateConfig(id: string, data: any) {
  try {
    await prisma.systemConfig.update({ where: { id }, data });
    revalidatePath("/admin/settings");
    revalidatePath("/"); // Update storefront state
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar la configuración" };
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
