import { prisma } from "@/lib/prisma";
import { CostsClient } from "./CostsClient";

export const dynamic = "force-dynamic";

export default async function CostsPage() {
  const supplies = await prisma.supply.findMany({
    orderBy: { name: "asc" }
  });
  
  const productions = await prisma.production.findMany({
    include: {
      items: {
        include: { supply: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 relative">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Bodega y Costos</h2>
        <p className="text-muted-foreground hidden sm:block">
           Inventario base y mermas procesadas para cálculo de receta.
        </p>
      </div>
      <CostsClient initialSupplies={supplies} initialProductions={productions} />
    </div>
  );
}
