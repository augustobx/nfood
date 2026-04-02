"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateUserPoints(clientId: string, points: number) {
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { points: Math.max(0, points) }
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al actualizar los puntos." };
  }
}
