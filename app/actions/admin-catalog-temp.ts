import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/catalog");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar categoría. Verifica si tiene productos." };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/catalog");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar producto." };
  }
}

export async function deleteIngredient(id: string) {
  try {
    await prisma.ingredient.delete({ where: { id } });
    revalidatePath("/admin/catalog");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar ingrediente." };
  }
}

export async function deleteExtra(id: string) {
  try {
    await prisma.extra.delete({ where: { id } });
    revalidatePath("/admin/catalog");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar extra." };
  }
}