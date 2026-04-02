import { prisma } from "@/lib/prisma";
import { StorefrontClient } from "./StorefrontClient";
import { getLoggedClient } from "@/lib/auth";

export default async function StorePage() {
  const config = await prisma.systemConfig.findFirst();
  const loggedClient = await getLoggedClient();
  
  if (config && !config.isStoreOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4 px-4 bg-slate-50">
        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-4xl">😴</div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">Cerrado por el momento</h1>
        <p className="text-muted-foreground text-lg max-w-sm">{config.closedMessage || "Volvé pronto para hacer tu pedido o revisá nuestros horarios comerciales."}</p>
      </div>
    );
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sequence: 'asc' },
    include: {
      products: {
        where: { isActive: true, isCombo: false },
        include: {
          ingredients: { include: { ingredient: true } },
          extras: { include: { extra: true } }
        }
      }
    }
  });

  const combos = await prisma.product.findMany({
    where: { isActive: true, isCombo: true },
    orderBy: { basePrice: 'asc' },
    include: {
      comboItemsConfig: { include: { product: { include: { ingredients: { include: { ingredient: true } } } } } }
    }
  });

  const prizes = await prisma.roulettePrize.findMany({
    include: { product: true }
  });

  // Safe client without password
  const safeClient = loggedClient ? { id: loggedClient.id, name: loggedClient.name, phone: loggedClient.phone, points: loggedClient.points } : null;

  return (
    <StorefrontClient categories={categories} combos={combos} loggedClient={safeClient} config={config} prizes={prizes} />
  );
}
