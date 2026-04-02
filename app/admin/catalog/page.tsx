import { prisma } from "@/lib/prisma";
import { CatalogClient } from "./CatalogClient";

export default async function CatalogPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sequence: 'asc' },
    include: {
      products: {
        include: {
          ingredients: true,
          extras: { include: { extra: true } }
        }
      }
    }
  });

  const allExtras = await prisma.extra.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catálogo de Productos</h1>
        <p className="text-muted-foreground">Administra tus categorías, productos, ingredientes y extras.</p>
      </div>

      <CatalogClient initialCategories={categories} allExtras={allExtras} />
    </div>
  );
}
