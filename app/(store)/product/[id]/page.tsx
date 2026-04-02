import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductDetailsClient } from "./ProductDetailsClient";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      ingredients: true,
      extras: {
        include: { extra: true }
      }
    }
  });

  if (!product || !product.isActive) {
    return notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ProductDetailsClient product={product} />
    </div>
  );
}
