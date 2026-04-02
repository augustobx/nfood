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

export async function upsertProduct(data: { 
  id?: string,
  name: string, 
  basePrice: number, 
  points: number,
  description: string, 
  categoryId?: string | null, 
  imageUrl: string, 
  ingredientsData: {id: string, quantity: number}[], 
  extraIds: string[],
  allowHalf: boolean,
  onlyHalf: boolean,
  isCombo: boolean,
  comboItemsData: {id: string, quantity: number}[]
}) {
  try {
    const payload = { 
      name: data.name,
      basePrice: data.basePrice,
      points: data.points,
      description: data.description,
      categoryId: data.categoryId || undefined,
      imageUrl: data.imageUrl,
      allowHalf: data.allowHalf,
      onlyHalf: data.onlyHalf,
      isCombo: data.isCombo,
    };

    if (data.id) {
      // Update logic: clear previous relations and update
      await prisma.$transaction([
        prisma.productIngredient.deleteMany({ where: { productId: data.id } }),
        prisma.productExtra.deleteMany({ where: { productId: data.id } }),
        prisma.productComboItem.deleteMany({ where: { comboId: data.id } }),
        prisma.product.update({
          where: { id: data.id },
          data: {
            ...payload,
            ingredients: { create: data.ingredientsData.map(ing => ({ ingredientId: ing.id, isRemovable: true, quantity: ing.quantity })) },
            extras: { create: data.extraIds.map(id => ({ extraId: id })) },
            comboItemsConfig: data.isCombo ? { create: data.comboItemsData.map(item => ({ productId: item.id, quantity: item.quantity })) } : undefined
          }
        })
      ]);
    } else {
      // Create logic
      await prisma.product.create({ 
        data: { 
          ...payload,
          isActive: true,
          ingredients: { create: data.ingredientsData.map(ing => ({ ingredientId: ing.id, isRemovable: true, quantity: ing.quantity })) },
          extras: { create: data.extraIds.map(id => ({ extraId: id })) },
          comboItemsConfig: data.isCombo ? { create: data.comboItemsData.map(item => ({ productId: item.id, quantity: item.quantity })) } : undefined
        } 
      });
    }

    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { console.error(error); return { success: false, error: "Error al guardar producto" }; }
}

export async function toggleProduct(id: string, isActive: boolean) {
  try {
    await prisma.product.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al actualizar producto" }; }
}

export async function toggleProductImage(id: string, showImage: boolean) {
  try {
    await prisma.product.update({ where: { id }, data: { showImage } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al actualizar mostrar imagen" }; }
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

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al eliminar categoría. Verifica si tiene productos." }; }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al eliminar producto." }; }
}

export async function deleteIngredient(id: string) {
  try {
    await prisma.ingredient.delete({ where: { id } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al eliminar ingrediente." }; }
}

export async function deleteExtra(id: string) {
  try {
    await prisma.extra.delete({ where: { id } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al eliminar extra." }; }
}
