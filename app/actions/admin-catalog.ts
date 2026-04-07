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
  suggestedCost?: number,
  points: number,
  description: string,
  categoryId?: string | null,
  imageUrl: string,
  ingredientsData: { id: string, quantity: number }[],
  extraIds: string[],
  allowHalf: boolean,
  onlyHalf: boolean,
  allowRemoveIngredients: boolean,
  isCombo: boolean,
  comboItemsData: { id: string, quantity: number }[]
}) {
  try {
    const payload = {
      name: data.name,
      basePrice: data.basePrice,
      suggestedCost: data.suggestedCost || 0,
      points: data.points,
      description: data.description,
      imageUrl: data.imageUrl,
      allowHalf: data.allowHalf,
      onlyHalf: data.onlyHalf,
      allowRemoveIngredients: data.allowRemoveIngredients,
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
             category: data.categoryId ? { connect: { id: data.categoryId } } : { disconnect: true },
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
          category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
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

export async function addIngredient(data: { name: string, categoryIds: string[], purchaseVolume: string, purchasePrice: number, yieldUnits: number }) {
  try {
    // Calculamos el costo por unidad automáticamente
    const costPerUnit = data.yieldUnits > 0 ? data.purchasePrice / data.yieldUnits : 0;

    await prisma.ingredient.create({
      data: {
        name: data.name,
        purchaseVolume: data.purchaseVolume,
        purchasePrice: data.purchasePrice,
        yieldUnits: data.yieldUnits,
        costPerUnit: costPerUnit,
        stock: data.yieldUnits, // El stock inicial es lo que rinde esa primera compra
        categories: {
          create: data.categoryIds.map(id => ({ categoryId: id }))
        }
      }
    });
    revalidatePath("/admin/catalog");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al crear ingrediente." };
  }
}

export async function restockIngredient(id: string, purchasePrice: number, yieldUnits: number, purchaseVolume: string) {
  try {
    const costPerUnit = yieldUnits > 0 ? purchasePrice / yieldUnits : 0;
    await prisma.ingredient.update({
      where: { id },
      data: {
        purchasePrice,
        yieldUnits,
        purchaseVolume,
        costPerUnit,
        stock: { increment: yieldUnits } // Sumamos el nuevo rinde al stock que ya había
      }
    });
    revalidatePath("/admin/catalog");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al recargar stock." };
  }
}

export async function toggleIngredient(id: string, isActive: boolean) {
  try {
    await prisma.ingredient.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al actualizar ingrediente" }; }
}

export async function upsertExtra(name: string, price: number, id?: string) {
  try {
    if (id) {
       await prisma.extra.update({ where: { id }, data: { name, price } });
    } else {
       await prisma.extra.create({ data: { name, price, isActive: true } });
    }
    revalidatePath("/admin/catalog"); revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false, error: "Error al guardar extra" }; }
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
