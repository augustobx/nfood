"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Menu } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export function Navbar({ config }: { config?: any }) {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const [open, setOpen] = useState(false);

  // Dynamic branding
  const appName = config?.appName || 'nfood';
  const primaryColor = config?.primaryColor || '#f97316';
  const secondaryColor = config?.secondaryColor || '#9333ea';

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 mx-auto max-w-7xl">
        <div className="flex items-center gap-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              }
            />
            <SheetContent side="left" className="w-[85vw] max-w-sm flex flex-col p-6">
              <SheetHeader className="text-left mb-4">
                <SheetTitle className="text-2xl font-black flex items-center gap-2" style={{ color: primaryColor }}>
                  {config?.logoUrl ? <img src={config.logoUrl} className="h-8 object-contain" alt="logo" /> : <>🍔 {appName}</>}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 mt-4 flex-1">
                <Link href="/" onClick={() => setOpen(false)} className="text-lg font-bold p-4 hover:brightness-95 transition-colors rounded-2xl flex items-center gap-2" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                   🛍️ Menú de Productos
                </Link>
                <Link href="/profile" onClick={() => setOpen(false)} className="text-lg font-bold p-4 hover:brightness-95 transition-colors rounded-2xl flex items-center gap-2" style={{ backgroundColor: `${secondaryColor}15`, color: secondaryColor }}>
                   🧾 Mis Pedidos / Puntos
                </Link>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            {config?.logoUrl ? (
               <img src={config.logoUrl} alt={appName} className="max-h-8 object-contain" />
            ) : (
               <span className="font-black text-2xl tracking-tighter" style={{ color: primaryColor }}>{appName}</span>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/cart">
            <Button variant="outline" size="icon" className="relative rounded-full">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 px-1.5 min-w-[1.25rem] h-5 py-0 flex items-center justify-center rounded-full text-xs bg-red-500">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}