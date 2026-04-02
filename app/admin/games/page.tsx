import { prisma } from "@/lib/prisma";
import { GamesClient } from "./GamesClient";

export default async function GamesPage() {
  const config = await prisma.systemConfig.findFirst();
  const prizes = await prisma.roulettePrize.findMany({
    include: { product: true }
  });
  
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, basePrice: true }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div>
         <h1 className="text-3xl font-black tracking-tight text-slate-800">Panel de Juegos</h1>
         <p className="text-muted-foreground">Configurá "La Ruleta de la Suerte" y premiá a tus clientes.</p>
       </div>

       <GamesClient 
         initialActive={config?.isRouletteActive || false}
         initialCost={config?.rouletteCost || 0}
         prizes={prizes}
         products={products}
       />
    </div>
  );
}
