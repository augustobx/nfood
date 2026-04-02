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

export async function addProduct(data: { name: string, basePrice: number, description: string, categoryId: string, imageUrl: string, ingredientIds: string[], extraIds: string[] }) {
  try {
    await prisma.product.create({ 
      data: { 
        name: data.name,
        basePrice: data.basePrice,
        description: data.description,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
        isActive: true,
        ingredients: {
          create: data.ingredientIds.map(id => ({ ingredientId: id, isRemovable: true }))
        },
        extras: {
          create: data.extraIds.map(id => ({ extraId: id }))
        }
      } 
    });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { console.error(error); return { success: false, error: "Error al crear producto" }; }
}

export async function toggleProduct(id: string, isActive: boolean) {
  try {
    await prisma.product.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al actualizar producto" }; }
}

export async function addIngredient(name: string, categoryIds: string[]) {
  try {
    await prisma.ingredient.create({
      data: {
        name,
        isActive: true,
        categories: {
          create: categoryIds.map(id => ({ categoryId: id }))
        }
      }
    });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { console.error(error); return { success: false, error: "Error al crear ingrediente" }; }
}

export async function toggleIngredient(id: string, isActive: boolean) {
  try {
    await prisma.ingredient.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al actualizar ingrediente" }; }
}

export async function addExtra(name: string, price: number) {
  try {
    await prisma.extra.create({ data: { name, price, isActive: true } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al crear extra" }; }
}

export async function toggleExtra(id: string, isActive: boolean) {
  try {
    await prisma.extra.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al actualizar extra" }; }
}
