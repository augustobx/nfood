import { getLoggedClient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ArrowLeft, Star, Package, MapPinIcon, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./LogoutButton";

export default async function ProfilePage() {
  const client = await getLoggedClient();
  
  if (!client) {
    redirect("/");
  }

  const orders = await prisma.order.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: true } }
    }
  });

  const activeOrders = orders.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const pastOrders = orders.filter(o => o.status === "DELIVERED" || o.status === "CANCELLED");

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 text-slate-800">
         <Link href="/">
           <button className="w-10 h-10 bg-white border shadow-sm rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
           </button>
         </Link>
         <div className="flex-1">
           <h1 className="text-3xl font-black tracking-tight">Mi Perfil</h1>
           <p className="text-muted-foreground text-sm font-medium">Hola, {client.name || client.phone}!</p>
         </div>
         <LogoutButton />
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-[2rem] p-8 text-white shadow-lg mb-8 relative overflow-hidden">
        <Star className="absolute -right-8 -bottom-8 w-48 h-48 text-yellow-300 opacity-20" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold opacity-90 mb-1">Tus Puntos Acumulados</h2>
          <div className="text-6xl font-black tracking-tighter drop-shadow-sm flex items-end gap-2">
            {client.points} <span className="text-2xl font-bold opacity-80 mb-2 tracking-tight">pts</span>
          </div>
          <p className="text-sm font-medium opacity-90 mt-2 bg-white/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm">Con cada pedido sumás más!</p>
        </div>
      </div>

      {activeOrders.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-black text-slate-800 mb-4">Pedidos en curso</h3>
          <div className="space-y-4">
            {activeOrders.map(order => (
              <Link href={`/track/${order.id}`} key={order.id} className="block">
                <div className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-2 h-full bg-orange-500" />
                   <div className="flex justify-between items-start mb-2">
                     <span className="font-bold text-slate-800">Orden #{order.id.slice(-6).toUpperCase()}</span>
                     <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                       {order.status === 'IN_PROCESS' && <Clock className="w-3 h-3"/>}
                       {order.status === 'FINISHED' && <MapPinIcon className="w-3 h-3"/>}
                       {order.status === 'NEW' && <Package className="w-3 h-3"/>}
                       {order.status}
                     </span>
                   </div>
                   <p className="text-sm text-slate-500 line-clamp-1">
                     {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(", ")}
                   </p>
                   <div className="mt-3 flex justify-between items-end">
                     <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                     <span className="font-black text-slate-800">${order.total.toLocaleString('es-AR')}</span>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-black text-slate-800 mb-4">Historial de Compras</h3>
        {pastOrders.length === 0 ? (
           <div className="text-center p-8 bg-slate-50 rounded-2xl border text-slate-500">Aún no hay compras pasadas.</div>
        ) : (
          <div className="space-y-3">
            {pastOrders.map(order => (
              <div key={order.id} className="bg-white/50 border rounded-2xl p-4 flex items-center justify-between">
                 <div>
                   <span className="font-bold text-slate-700 block text-sm">#{order.id.slice(-6).toUpperCase()} {order.status === "CANCELLED" && <span className="text-red-500 text-xs ml-2">(Cancelado)</span>}</span>
                   <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                 </div>
                 <div className="text-right">
                   <span className="font-bold text-slate-700 block">${order.total.toLocaleString('es-AR')}</span>
                   {order.earnedPoints > 0 && <span className="text-xs font-bold text-yellow-600 block">+{order.earnedPoints} pts</span>}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
