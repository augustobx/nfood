"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addCategory(name: string) {
  try {
    await prisma.category.create({ data: { name, isActive: true } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al crear categoría" }; }
}

export async function toggleCategory(id: string, isActive: boolean) {
  try {
    await prisma.category.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al actualizar categoría" }; }
}

export async function addProduct(data: { name: string, basePrice: number, description: string, categoryId: string, imageUrl: string; }) {
  try {
    await prisma.product.create({ data: { ...data, isActive: true } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al crear producto" }; }
}

export async function toggleProduct(id: string, isActive: boolean) {
  try {
    await prisma.product.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al actualizar producto" }; }
}
