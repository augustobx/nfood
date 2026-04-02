import { prisma } from "@/lib/prisma";
import { MetricsClient } from "./MetricsClient";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const [orders, expenses, products] = await Promise.all([
     prisma.order.findMany({
       where: { status: { not: 'CANCELLED' } },
       include: {
         items: {
           include: {
             product: true
           }
         }
       },
       orderBy: { createdAt: 'asc' }
     }),
     prisma.expense.findMany({
       include: {
         supply: true
       },
       orderBy: { date: 'asc' }
     }),
     prisma.product.findMany({
       where: { isActive: true },
       orderBy: { name: 'asc' }
     })
  ]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Métricas y Rentabilidad</h2>
        <p className="text-muted-foreground hidden sm:block">
           Inteligencia de negocios y Food Cost general.
        </p>
      </div>    
      <MetricsClient orders={orders} expenses={expenses} products={products} />
    </div>
  );
}
