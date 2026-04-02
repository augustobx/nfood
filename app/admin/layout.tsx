import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const routes = [
    { name: "Live Dashboard", href: "/admin/live", icon: LayoutDashboard },
    { name: "Catálogo", href: "/admin/catalog", icon: ShoppingBag },
    { name: "Configuración", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white">
        <div className="flex h-14 items-center border-b border-slate-800 px-4">
          <Link href="/admin/live" className="flex items-center gap-2 font-bold text-xl">
            nfood Admin
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <Link 
                key={route.href} 
                href={route.href} 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
              >
                <Icon className="h-5 w-5" />
                {route.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-4 border-b bg-white px-6 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-slate-900 border-none p-0">
              <div className="flex h-14 items-center border-b border-slate-800 px-4">
                <span className="font-bold text-xl text-white">nfood Admin</span>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                {routes.map((route) => {
                  const Icon = route.icon;
                  return (
                    <Link 
                      key={route.href} 
                      href={route.href} 
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
                    >
                      <Icon className="h-5 w-5" />
                      {route.name}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <span className="font-bold">Admin Panel</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
