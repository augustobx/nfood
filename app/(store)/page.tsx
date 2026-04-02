import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default async function StorePage() {
  const config = await prisma.systemConfig.findFirst();
  
  if (config && !config.isStoreOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">Cerrado por el momento</h1>
        <p className="text-muted-foreground">Volvé pronto para hacer tu pedido.</p>
      </div>
    );
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sequence: 'asc' },
    include: {
      products: {
        where: { isActive: true },
      }
    }
  });

  if (categories.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        El menú se está preparando...
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Nuestro Menú</h1>
          <p className="text-muted-foreground text-lg">Elegí lo que más te guste y pedilo en segundos.</p>
        </div>
      </div>

      {categories.map((category) => (
        category.products.length > 0 && (
          <section key={category.id} id={category.id} className="scroll-m-20">
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
              <h2 className="text-2xl font-semibold tracking-tight">{category.name}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {category.products.map((product) => (
                <Card key={product.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  {product.imageUrl ? (
                    <div className="aspect-video w-full relative bg-muted">
                      <Image 
                        src={product.imageUrl} 
                        alt={product.name} 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-orange-100 flex items-center justify-center">
                      <ShoppingBag className="h-10 w-10 text-orange-300" />
                    </div>
                  )}
                  
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="leading-tight text-lg">{product.name}</CardTitle>
                      <span className="font-bold text-lg text-orange-600 whitespace-nowrap">
                        ${product.basePrice.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0 flex-1">
                    <CardDescription className="line-clamp-2">
                      {product.description || "Sin descripción"}
                    </CardDescription>
                  </CardContent>
                  
                  <CardFooter className="p-4 pt-0">
                    <Link href={`/product/${product.id}`} className="w-full">
                      <Button className="w-full">Ver Detalles</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )
      ))}
    </div>
  );
}
