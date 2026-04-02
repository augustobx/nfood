"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Copy, Navigation, Phone, MessageCircle, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { updateOrderStatus, assignMessenger } from "@/app/actions/admin-orders";

export default function LiveDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [messengers, setMessengers] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastOrderCountRef = useRef(0);

  // Poll for data every 5 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchData = async () => {
      try {
        const [ordersRes, messengersRes, configRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/messengers"),
          fetch("/api/config")
        ]);
        
        if (ordersRes.ok) {
          const newOrders = await ordersRes.json();
          setOrders(newOrders);
          
          // Check if there are new orders that are NEW to trigger alarm
          const currentNewOrdersCount = newOrders.filter((o: any) => o.status === "NEW").length;
          
          if (isMonitoring && currentNewOrdersCount > lastOrderCountRef.current) {
            playAlert();
          }
          lastOrderCountRef.current = currentNewOrdersCount;
        }

        if (messengersRes.ok) setMessengers(await messengersRes.json());
        if (configRes.ok) setConfig(await configRes.json());
        
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    fetchData(); // Initial
    interval = setInterval(fetchData, 5000);
    
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setIsMonitoring(true);
    toast.success("Monitoreo activado", { description: "Se reproducirá un sonido con los nuevos pedidos." });
  };

  const playAlert = () => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtxRef.current.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(1, audioCtxRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.5);
    
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.5);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      // Generate WhatsApp msg if configured
      const order = orders.find(o => o.id === orderId);
      if (order && config?.whatsappMessage) {
        const msg = config.whatsappMessage.replace(/{{estado}}/g, newStatus);
        const waUrl = `https://wa.me/${order.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, "_blank");
      }
    } else {
      toast.error("Error", { description: result.error });
    }
  };

  const handleMessengerChange = async (orderId: string, messengerId: string) => {
    const result = await assignMessenger(orderId, messengerId === "none" ? null : messengerId);
    if (result.success) {
      const messenger = messengers.find(m => m.id === messengerId) || null;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, messenger, messengerId: messenger?.id || null } : o));
      toast.success("Mensajero asignado");
    }
  };

  const columns = [
    { id: "NEW", title: "Nuevos", color: "bg-blue-100 border-blue-200" },
    { id: "IN_PROCESS", title: "En Proceso", color: "bg-yellow-100 border-yellow-200" },
    { id: "FINISHED", title: "Finalizado / Listo", color: "bg-green-100 border-green-200" },
    { id: "DELIVERED", title: "Entregados (Hoy)", color: "bg-gray-100 border-gray-200" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Dashboard</h1>
          <p className="text-muted-foreground">Monitoreo en tiempo real de pedidos.</p>
        </div>
        
        <div>
          {!isMonitoring ? (
            <Button onClick={initAudio} variant="default" className="bg-red-600 hover:bg-red-700 animate-pulse">
              <AlertCircle className="mr-2 h-4 w-4" /> Activar Alertas de Sonido
            </Button>
          ) : (
            <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 px-4 py-1.5 cursor-pointer" onClick={playAlert}>
              <div className="w-2 h-2 rounded-full bg-green-600 animate-ping mr-2"></div>
              Monitoreo Activo (Test Audio)
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {columns.map((col) => {
          const colOrders = orders.filter((o: any) => o.status === col.id);
          
          return (
            <div key={col.id} className="flex flex-col gap-4">
              <div className={`p-3 rounded-lg border font-bold flex justify-between items-center ${col.color}`}>
                <span>{col.title}</span>
                <Badge variant="secondary" className="bg-white/50">{colOrders.length}</Badge>
              </div>

              <div className="flex flex-col gap-4">
                {colOrders.map(order => (
                  <Card key={order.id} className="shadow-sm border-l-4" style={{borderLeftColor: order.needsDelivery ? '#f97316' : '#3b82f6'}}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">#{order.id.slice(-5).toUpperCase()}</CardTitle>
                          <p className="text-sm font-medium mt-1">{order.clientName}</p>
                        </div>
                        <Badge variant="outline" className={order.needsDelivery ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                          {order.needsDelivery ? 'Envío' : 'Retiro'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-1 pb-3 text-sm space-y-3">
                      <div className="flex flex-col gap-1 text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          <a href={`https://wa.me/${order.clientPhone.replace(/\D/g,'')}`} target="_blank" className="hover:text-blue-600 hover:underline">{order.clientPhone}</a>
                        </span>
                        {order.needsDelivery && (
                          <span className="flex items-center gap-1.5 text-foreground font-medium">
                            <Navigation className="h-3.5 w-3.5" />
                            {order.deliveryAddress}
                          </span>
                        )}
                        <span className="font-medium text-foreground">
                          {order.deliveryTime === 'Lo antes posible' ? 'ASAP' : `Hora: ${order.deliveryTime}`}
                        </span>
                      </div>

                      <div className="border border-dashed rounded bg-slate-50 p-2 space-y-1">
                        {order.items.map((item: any) => (
                          <div key={item.id}>
                            <div className="font-semibold text-xs">{item.quantity}x {item.product.name}</div>
                            {item.addedExtras?.length > 0 && <div className="text-[10px] text-orange-600">+{item.addedExtras.map((ex:any)=>ex.extra.name).join(', ')}</div>}
                            {item.removedIngredients?.length > 0 && <div className="text-[10px] text-red-600">-sin {item.removedIngredients.map((ing:any)=>ing.ingredient.name).join(', ')}</div>}
                            {item.notes && <div className="text-[10px] italic text-gray-500">"{item.notes}"</div>}
                          </div>
                        ))}
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                      {/* Status Next Action Button */}
                      {col.id === "NEW" && (
                        <div className="flex gap-2 w-full">
                          <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusChange(order.id, "CANCELLED")}>
                            <Trash2 className="h-4 w-4 mr-1" /> Rechazar
                          </Button>
                          <Button size="sm" className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => handleStatusChange(order.id, "IN_PROCESS")}>
                            Preparar
                          </Button>
                        </div>
                      )}
                      
                      {col.id === "IN_PROCESS" && (
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange(order.id, "FINISHED")}>
                          Finalizar Pedido
                        </Button>
                      )}

                      {col.id === "FINISHED" && (
                        <Button size="sm" className="w-full bg-gray-800 hover:bg-black text-white" onClick={() => handleStatusChange(order.id, "DELIVERED")}>
                          Marcar Entregado
                        </Button>
                      )}

                      {order.needsDelivery && (col.id === "IN_PROCESS" || col.id === "FINISHED") && (
                        <Select 
                          value={order.messengerId !== null ? order.messengerId : "none"} 
                          onValueChange={(v) => handleMessengerChange(order.id, v)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Asignar repartidor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin asignación</SelectItem>
                            {messengers.filter(m => m.isActive).map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {/* Manual WhatsApp Msg */}
                      <Button variant="outline" size="sm" className="w-full h-7 text-xs border-green-200 text-green-700 hover:bg-green-50" onClick={() => {
                        const msg = config?.whatsappMessage.replace(/{{estado}}/g, col.title) || 'Hola, tenemos novedades de tu pedido.';
                        window.open(`https://wa.me/${order.clientPhone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}>
                        <MessageCircle className="h-3 w-3 mr-1" /> Enviar WhatsApp
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                {colOrders.length === 0 && (
                  <div className="border border-dashed p-6 rounded-lg text-center text-sm text-muted-foreground bg-slate-50">
                    No hay pedidos acá
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
