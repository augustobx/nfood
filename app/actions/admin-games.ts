"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleRoulette(isActive: boolean) {
  try {
    const config = await prisma.systemConfig.findFirst();
    if (!config) return { success: false, error: "No system config found" };
    
    await prisma.systemConfig.update({
      where: { id: config.id },
      data: { isRouletteActive: isActive }
    });
    
    revalidatePath("/admin/games");
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error updating roulette state" };
  }
}

export async function updateRouletteCost(cost: number) {
  try {
    const config = await prisma.systemConfig.findFirst();
    if (!config) return { success: false, error: "No system config found" };
    
    await prisma.systemConfig.update({
      where: { id: config.id },
      data: { rouletteCost: cost }
    });
    
    revalidatePath("/admin/games");
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error updating roulette cost" };
  }
}

export async function addRoulettePrize(data: any) {
  try {
    const { name, probability, type, value, productId, bgColor, textColor } = data;
    
    await prisma.roulettePrize.create({
      data: {
         name,
         probability: Number(probability),
         type,
         value: value ? Number(value) : null,
         productId: productId || null,
         bgColor,
         textColor
      }
    });
    
    revalidatePath("/admin/games");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error adding prize" };
  }
}

export async function deleteRoulettePrize(id: string) {
  try {
    await prisma.roulettePrize.delete({ where: { id } });
    revalidatePath("/admin/games");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error deleting prize" };
  }
}
