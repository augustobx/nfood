import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PrintTicketClient } from "./PrintTicketClient";

export default async function PrintTicketPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
         include: {
           product: true,
           addedExtras: { include: { extra: true } },
           removedIngredients: { include: { ingredient: true } }
         }
      }
    }
  });

  const config = await prisma.systemConfig.findFirst();

  if (!order) return notFound();

  return <PrintTicketClient order={order} config={config} />;
}
