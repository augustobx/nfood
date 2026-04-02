import { prisma } from "@/lib/prisma";
import { CatalogClient } from "./CatalogClient";

export default async function CatalogPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sequence: 'asc' },
    include: {
      products: {
        include: {
          ingredients: { include: { ingredient: true } },
          extras: { include: { extra: true } },
          comboItemsConfig: true
        }
      }
    }
  });

  const allExtras = await prisma.extra.findMany({
    orderBy: { name: 'asc' }
  });

  const allIngredients = await prisma.ingredient.findMany({
    orderBy: { name: 'asc' },
    include: { categories: true }
  });

  const allCombos = await prisma.product.findMany({
    where: { isCombo: true },
    include: { comboItemsConfig: true }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catálogo de Productos</h1>
        <p className="text-muted-foreground">Administra tus categorías, productos, ingredientes y extras.</p>
      </div>

      <CatalogClient 
        initialCategories={categories} 
        allExtras={allExtras} 
        allIngredients={allIngredients} 
        allCombos={allCombos}
      />
    </div>
  );
}
