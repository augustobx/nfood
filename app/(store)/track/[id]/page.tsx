import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Copy, MapPin, Package, CheckCircle2, Clock, MapPinIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AutoRefresh from "./AutoRefresh";
import MPReturnHandler from "./MPReturnHandler";
import { revalidatePath } from "next/cache";

export default async function TrackOrderPage(props: { params: Promise<{ id: string }>, searchParams?: Promise<{ status?: string, payment?: string, mp_start?: string }> }) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
          addedExtras: { include: { extra: true } },
          removedIngredients: { include: { ingredient: true } }
        }
      },
      messenger: true
    }
  });

  if (!order) return notFound();

  let isCancelled = order.status === "CANCELLED";

  const statuses = [
    { id: "NEW", label: "Recibido", icon: Package },
    { id: "IN_PROCESS", label: "Preparando", icon: Clock },
    { id: "FINISHED", label: order.needsDelivery ? "En camino" : "Listo para retirar", icon: order.needsDelivery ? MapPinIcon : Package },
    { id: "DELIVERED", label: "Entregado", icon: CheckCircle2 }
  ];

  const currentIndex = statuses.findIndex(s => s.id === order.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
      <AutoRefresh intervalMs={30000} />
      <MPReturnHandler status={searchParams?.status || undefined} orderId={order.id} />
      
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Estado de tu pedido</h1>
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          Orden #{order.id.slice(-6).toUpperCase()}
        </p>
      </div>

      {isCancelled ? (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6 text-center text-destructive">
            <h2 className="text-2xl font-bold mb-2">Pedido Cancelado</h2>
            <p>{order.paymentMethod === 'MP' ? 'Cancelado por demora en el pago o por decisión del usuario.' : 'Tu pedido ha sido cancelado. Comunicate con nosotros para más información.'}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6 md:p-8">
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 w-full h-1 bg-muted rounded-full">
              <div 
                className="h-full bg-orange-600 rounded-full transition-all duration-500"
                style={{ width: `${(Math.max(0, currentIndex) / (statuses.length - 1)) * 100}%` }}
              />
            </div>
            
            <div className="relative flex justify-between">
              {statuses.map((s, idx) => {
                const Icon = s.icon;
                const isCompleted = currentIndex >= idx;
                const isCurrent = currentIndex === idx;
                
                return (
                  <div key={s.id} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors ${isCompleted ? 'bg-orange-600 text-white shadow-lg' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs sm:text-sm font-medium text-center max-w-[80px] ${isCurrent ? 'text-orange-600' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {order.messenger && order.status === "FINISHED" && (
        <Card className="bg-orange-50/50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
              <MapPinIcon className="w-5 h-5" />
              Tu repartidor está en camino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-lg">{order.messenger.name}</p>
            {order.messenger.phone && (
              <p className="text-muted-foreground">Tel: {order.messenger.phone}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="divide-y border rounded-lg">
            {order.items.map(item => (
              <div key={item.id} className="p-4 flex justify-between gap-4">
                <div>
                  <div className="font-semibold">{item.quantity}x {item.product.name}</div>
                  {item.addedExtras.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {item.addedExtras.map(ex => (
                        <span key={ex.extraId} className="block text-orange-600">+ {ex.extra.name}</span>
                      ))}
                    </div>
                  )}
                  {item.removedIngredients.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="block italic">Sin algunos ingredientes</span>
                    </div>
                  )}
                  {item.notes && <p className="text-sm text-muted-foreground mt-1 text-inherit italic">"{item.notes}"</p>}
                </div>
                <div className="font-medium whitespace-nowrap">
                  ${item.subtotal.toLocaleString('es-AR')}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 border-t pt-4 text-right">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${(order.total - (order.needsDelivery ? 500 : 0)).toLocaleString('es-AR')}</span>
            </div>
            {order.needsDelivery && (
              <div className="flex justify-between text-muted-foreground">
                <span>Envío (Aprox)</span>
                <span>$500</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold mt-2">
              <span>Total pagado</span>
              <span className="text-orange-600">${order.total.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
