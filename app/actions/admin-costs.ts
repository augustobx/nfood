"use server";

import { prisma } from "@/lib/prisma";

// Calculate cost of 1 unit of a supply
export async function getSupplyUnitCost(supply: any) {
  if (!supply || supply.purchaseQuantity === 0) return 0;
  const baseCost = supply.purchasePrice / supply.purchaseQuantity;
  const wastePercent = supply.wastePercentage || 0;
  return baseCost / (1 - (wastePercent / 100));
}

// Calculate cost of 1 unit of a production
export async function getProductionUnitCost(productionId: string) {
  const prod = await prisma.production.findUnique({
    where: { id: productionId },
    include: {
      items: {
        include: { supply: true }
      }
    }
  });
  if (!prod || prod.yieldUnits === 0) return 0;

  let totalCost = 0;
  for (const item of prod.items) {
    const supplyCost = await getSupplyUnitCost(item.supply);
    totalCost += supplyCost * item.quantityUsed;
  }
  return totalCost / prod.yieldUnits;
}

export async function recalculateAllProductCosts() {
  const products = await prisma.product.findMany({
    include: {
      recipeItems: {
        include: { supply: true, production: true }
      }
    }
  });

  for (const p of products) {
    let suggestedCost = 0;
    
    // Sub-costs
    for (const ri of p.recipeItems) {
      if (ri.supplyId && ri.supply) {
        const cost = await getSupplyUnitCost(ri.supply);
        suggestedCost += cost * ri.quantityUsed;
      } else if (ri.productionId) {
         const cost = await getProductionUnitCost(ri.productionId);
         suggestedCost += cost * ri.quantityUsed;
      }
    }

    await prisma.product.update({
      where: { id: p.id },
      data: { suggestedCost }
    });
  }

  return { success: true };
}

export async function registerExpense(data: {
  supplyId: string;
  amount: number;
  quantity: number;
}) {
  const supply = await prisma.supply.findUnique({ where: { id: data.supplyId } });
  if (!supply) throw new Error("Supply not found");

  const oldUnitCost = supply.purchaseQuantity > 0 ? (supply.purchasePrice / supply.purchaseQuantity) : 0;
  const newPurchaseUnitCost = data.amount / data.quantity;
  
  let newWeightedUnitCost = newPurchaseUnitCost;
  
  if (supply.stockQuantity > 0) {
      const oldValuation = supply.stockQuantity * oldUnitCost;
      const newValuation = data.amount;
      newWeightedUnitCost = (oldValuation + newValuation) / (supply.stockQuantity + data.quantity);
  }

  // Record Expense
  await prisma.expense.create({
    data: {
      supplyId: data.supplyId,
      amount: data.amount,
      quantity: data.quantity,
    }
  });

  // Update Supply
  const newStock = supply.stockQuantity + data.quantity;
  await prisma.supply.update({
    where: { id: supply.id },
    data: {
      stockQuantity: newStock,
      purchasePrice: newWeightedUnitCost * supply.purchaseQuantity, // align with their declared pack size
    }
  });

  // Recalculate
  await recalculateAllProductCosts();

  return { success: true };
}

// Basic CRUD for UI
// ----- Supplies -----
export async function fetchSupplies() {
  return await prisma.supply.findMany({ orderBy: { name: 'asc' }});
}
export async function createSupply(data: any) {
  const s = await prisma.supply.create({ data });
  await recalculateAllProductCosts();
  return s;
}
export async function updateSupply(id: string, data: any) {
  const s = await prisma.supply.update({ where: { id }, data });
  await recalculateAllProductCosts();
  return s;
}
export async function deleteSupply(id: string) {
  await prisma.supply.delete({ where: { id } });
  await recalculateAllProductCosts();
  return { success: true };
}

// ----- Productions -----
export async function fetchProductions() {
  return await prisma.production.findMany({ 
    include: { items: { include: { supply: true } } },
    orderBy: { name: 'asc' }
  });
}
export async function createProduction(data: any) {
  const p = await prisma.production.create({
     data: {
       name: data.name,
       yieldUnits: data.yieldUnits,
       items: {
          create: data.items.map((i: any) => ({
             supplyId: i.supplyId,
             quantityUsed: i.quantityUsed
          }))
       }
     }
  });
  await recalculateAllProductCosts();
  return p;
}
export async function deleteProduction(id: string) {
  await prisma.production.delete({ where: { id }});
  await recalculateAllProductCosts();
  return { success: true };
}

// ----- Recipes -----
export async function fetchRecipeForProduct(productId: string) {
  return await prisma.recipeItem.findMany({
    where: { productId },
    include: { supply: true, production: true }
  });
}
export async function updateProductRecipe(productId: string, recipeItems: any[]) {
  await prisma.recipeItem.deleteMany({ where: { productId }});
  if (recipeItems.length > 0) {
     await prisma.recipeItem.createMany({
       data: recipeItems.map(r => ({
          productId,
          supplyId: r.supplyId || null,
          productionId: r.productionId || null,
          quantityUsed: r.quantityUsed
       }))
     });
  }
  await recalculateAllProductCosts();
  return { success: true };
}
