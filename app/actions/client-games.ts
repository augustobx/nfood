"use server";

import { prisma } from "@/lib/prisma";

export async function deductRoulettePoints(clientId: string, cost: number) {
  try {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return { success: false, error: "Client not found" };
    
    if (client.points < cost) {
       return { success: false, error: "Not enough points" };
    }
    
    await prisma.client.update({
       where: { id: clientId },
       data: { points: client.points - cost }
    });
    
    return { success: true, remainingPoints: client.points - cost };
  } catch (error) {
    return { success: false, error: "Transaction failed" };
  }
}
