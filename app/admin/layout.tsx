import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Settings, Menu, Users, Dices, PackageOpen, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const routes = [
    { name: "Live Dashboard", href: "/admin/live", icon: LayoutDashboard },
    { name: "Catálogo", href: "/admin/catalog", icon: ShoppingBag },
    { name: "Bodega y Costos", href: "/admin/costos", icon: PackageOpen },
    { name: "Métricas", href: "/admin/metricas", icon: TrendingUp },
    { name: "Juegos", href: "/admin/games", icon: Dices },
    { name: "Clientes", href: "/admin/users", icon: Users },
    { name: "Configuración", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-100">
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white">
        <div className="flex h-14 items-center border-b border-slate-800 px-4">
          <Link href="/admin/live" className="flex items-center gap-2 font-bold text-xl">nfood Admin</Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {routes.map((route) => (
            <Link key={route.href} href={route.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:bg-slate-800 hover:text-white">
              <route.icon className="h-5 w-5" /> {route.name}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-white px-6 md:hidden">
          <Sheet>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menú</span>
              </Button>
            } />
            <SheetContent side="left" className="w-64 bg-slate-900 border-none p-0 text-white">
              <div className="flex h-14 items-center border-b border-slate-800 px-4">nfood Admin</div>
              <nav className="p-4 space-y-1">
                {routes.map((route) => (
                  <Link key={route.href} href={route.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:text-white">
                    <route.icon className="h-5 w-5" /> {route.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <span className="font-bold">Admin Panel</span>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}