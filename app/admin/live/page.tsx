"use client";

import { useEffect, useState, useRef } from "react";
import { Copy, Navigation, Phone, MessageCircle, AlertCircle, Trash2, Clock, Printer, ChevronDown, ChevronUp, MapPin, CheckCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { updateOrderStatus, assignMessenger, dispatchMessengerRoadmap } from "@/app/actions/admin-orders";
import { updateSlotAvailable } from "@/app/actions/admin-settings";
import { AnimatePresence, motion } from "framer-motion";

export default function LiveDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [messengers, setMessengers] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastOrderCountRef = useRef(0);

  const toggleOrder = (id: string) => {
    setExpandedOrders(p => ({ ...p, [id]: !p[id] }));
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const [ordersRes, messengersRes, configRes, slotsRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/messengers"),
          fetch("/api/config"),
          fetch("/api/slots")
        ]);

        if (ordersRes.ok) {
          const newOrders = await ordersRes.json();
          setOrders(newOrders);

          const currentNewOrdersCount = newOrders.filter((o: any) => o.status === "NEW").length;

          if (isMonitoring && currentNewOrdersCount > lastOrderCountRef.current) {
            playAlert();
          }
          lastOrderCountRef.current = currentNewOrdersCount;
        }

        if (messengersRes.ok) setMessengers(await messengersRes.json());
        if (configRes.ok) setConfig(await configRes.json());
        if (slotsRes.ok) setSlots(await slotsRes.json());

      } catch (err) {
        console.error("Polling error", err);
      }
    };

    fetchData();
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
    toast.success("Monitoreo activado");
  };

  const playAlert = () => {
    if (!audioCtxRef.current) return;
    if (audioCtxRef.current.state === 'suspended') {
       audioCtxRef.current.resume();
    }
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

  const dispatchRoadmap = async (messengerId: string) => {
    const result = await dispatchMessengerRoadmap(messengerId);
    if (result.success) {
      toast.success("Enviado. Redirigiendo a WhatsApp...");
      const cadete = messengers.find(m => m.id === messengerId);
      const phone = cadete?.phone.replace(/\D/g, '') || "";
      // CORRECCIÓN: Se agregó el fallback || "" para evitar el error de undefined
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(result.text || "")}`;
      window.open(url, "_blank");

      setOrders(prev => prev.map(o => (o.messengerId === messengerId && o.status === "PENDING_DELIVERY") ? { ...o, status: "DELIVERED" } : o));
    } else {
      toast.error("Error", { description: result.error });
    }
  };

  const columns = [
    { id: "NEW", title: "Nuevos", color: "bg-blue-100 border-blue-200" },
    { id: "IN_PROCESS", title: "Preparando", color: "bg-yellow-100 border-yellow-200" },
    { id: "PENDING_DELIVERY", title: "Pendiente Envío", color: "bg-purple-100 border-purple-200" },
    { id: "FINISHED", title: "Listo p/ Retirar", color: "bg-green-100 border-green-200" },
    { id: "DELIVERED", title: "Entregados", color: "bg-gray-100 border-gray-200" }
  ];

  const todaysOrders = orders.filter(o => o.status !== "CANCELLED");
  const cashTotal = todaysOrders.filter(o => o.paymentMethod === "CASH" || o.paymentMethod === "EFVO").reduce((acc, o) => acc + (o.total || 0), 0);
  const mpTotal = todaysOrders.filter(o => o.paymentMethod === "MP").reduce((acc, o) => acc + (o.total || 0), 0);
  const orderCount = todaysOrders.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Live Dashboard</h1>
          <p className="text-muted-foreground">Flujo Acordeón y Despacho Rápido</p>
        </div>

        <div>
          {!isMonitoring ? (
            <Button onClick={initAudio} variant="default" className="bg-red-600 hover:bg-red-700 animate-pulse font-bold shadow-lg shadow-red-600/20">
              <AlertCircle className="mr-2 h-4 w-4" /> Alertas de Sonido (Apagadas)
            </Button>
          ) : (
            <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 px-4 py-1.5 cursor-pointer shadow-sm" onClick={playAlert}>
              <div className="w-2 h-2 rounded-full bg-green-600 animate-ping mr-2"></div>
              Monitoreo Activo (Test)
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
        {/* Stat Cards */}
        <div className="col-span-1 md:col-span-2 xl:col-span-1 bg-white border border-green-200 rounded-xl p-4 shadow-sm flex flex-col justify-center items-center">
            <span className="text-xs font-bold text-slate-500 uppercase">Efectivo Hoy</span>
            <span className="text-2xl font-black text-green-600">${cashTotal.toLocaleString('es-AR')}</span>
        </div>
        <div className="col-span-1 md:col-span-2 xl:col-span-1 bg-white border border-blue-200 rounded-xl p-4 shadow-sm flex flex-col justify-center items-center">
            <span className="text-xs font-bold text-slate-500 uppercase">Mercado Pago Hoy</span>
            <span className="text-2xl font-black text-blue-600">${mpTotal.toLocaleString('es-AR')}</span>
        </div>
        <div className="col-span-1 md:col-span-2 xl:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-center items-center">
            <span className="text-xs font-bold text-slate-500 uppercase">Pedidos Hoy</span>
            <span className="text-2xl font-black text-slate-800">{orderCount}</span>
        </div>

        {/* Cupos Strip */}
        <div className="col-span-1 md:col-span-2 xl:col-span-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 flex flex-col md:flex-row gap-4 items-center overflow-x-auto shadow-sm">
          <div className="font-black whitespace-nowrap text-purple-800 flex items-center gap-2">
            <Clock className="w-5 h-5" /> CUPOS HORARIOS
          </div>
          <div className="flex gap-3 px-2 flex-1 min-w-max">
            {slots.map(slot => (
              <div key={slot.id} className="bg-white border rounded-lg shadow-sm px-3 py-1 flex items-center gap-3">
                <span className="font-bold font-mono text-slate-700">{slot.time}</span>
                <div className="flex items-center gap-2 bg-slate-50 border rounded-full p-0.5">
                  <button onClick={async () => {
                    const res = await updateSlotAvailable(slot.id, -1);
                    if (res.success) setSlots(s => s.map(x => x.id === slot.id ? { ...x, available: Math.max(0, x.available - 1) } : x));
                  }} className="w-6 h-6 rounded-full bg-white text-red-600 font-bold shadow-sm">-</button>
                  <span className={`w-4 text-center font-bold text-sm ${slot.available === 0 ? 'text-red-500' : 'text-slate-700'}`}>{slot.available}</span>
                  <button onClick={async () => {
                    const res = await updateSlotAvailable(slot.id, 1);
                    if (res.success) setSlots(s => s.map(x => x.id === slot.id ? { ...x, available: x.available + 1 } : x));
                  }} className="w-6 h-6 rounded-full bg-white text-green-600 font-bold shadow-sm">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {columns.map((col) => {
          const colOrders = orders.filter((o: any) => o.status === col.id);

          return (
            <div key={col.id} className="flex flex-col gap-3">
              <div className={`p-3 rounded-xl border-2 font-black flex justify-between items-center text-slate-800 ${col.color} shadow-sm`}>
                <span className="tracking-tight">{col.title}</span>
                <Badge className="bg-black/10 text-black border-none pointer-events-none px-2">{colOrders.length}</Badge>
              </div>

              {col.id === "PENDING_DELIVERY" && messengers.map(m => {
                const cadetePendingCount = colOrders.filter(o => o.messengerId === m.id).length;
                if (cadetePendingCount === 0) return null;
                return (
                  <Button key={"m-" + m.id} onClick={() => dispatchRoadmap(m.id)} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-auto py-3 whitespace-normal leading-tight shadow flex justify-between">
                    <div className="text-left flex flex-col gap-0.5">
                      <span>Despachar Todo</span>
                      <span className="text-xs font-normal opacity-90">WhatsApp a {m.name}</span>
                    </div>
                    <Badge className="bg-white/20 text-white rounded-full">{cadetePendingCount}</Badge>
                  </Button>
                )
              })}

              <div className="flex flex-col gap-3">
                {colOrders.map(order => {
                  const isExpanded = expandedOrders[order.id] || false;
                  const isDelivery = order.needsDelivery;
                  return (
                    <Card key={order.id} className="shadow-sm border-l-4 rounded-xl overflow-hidden" style={{ borderLeftColor: isDelivery ? '#f97316' : '#3b82f6' }}>

                      <div className="p-3 select-none flex flex-col gap-3 bg-white">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleOrder(order.id)}>
                          <div className="leading-none space-y-1">
                            <div className="font-black text-lg text-slate-800 tracking-tight flex items-center gap-2">
                              #{order.id.slice(-5).toUpperCase()}
                              {isDelivery ? <Truck className="w-4 h-4 text-orange-500" /> : <MapPin className="w-4 h-4 text-blue-500" />}
                            </div>
                            <div className="text-xs font-bold text-slate-500 line-clamp-1">{order.clientName}</div>
                          </div>
                          <div className="flex gap-1 items-center">
                            {order.paymentMethod === 'MP' ? (
                              order.paymentStatus === 'PAID' ? 
                                <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px] px-1 pointer-events-none">MP: OK</Badge> : 
                                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-[10px] px-1 pointer-events-none">MP: PEND</Badge>
                            ) : (
                                <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-[10px] px-1 pointer-events-none">EFVO</Badge>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-black hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); window.open(`/admin/live/print/${order.id}`, '_blank', 'width=300,height=500'); }}>
                              <Printer className="w-4 h-4" />
                            </Button>
                            <div className="p-1 rounded-md text-slate-400">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                          </div>
                        </div>

                        {col.id === "NEW" && (
                          <div className="flex flex-col gap-2 relative">
                             {order.paymentMethod === 'MP' && order.paymentStatus === 'PENDING' && (
                               <div className="absolute inset-0 bg-yellow-400/90 z-10 flex flex-col items-center justify-center rounded-lg border-2 border-yellow-500 backdrop-blur-sm p-2 text-center shadow-lg">
                                 <AlertCircle className="w-6 h-6 text-yellow-900 mb-1" />
                                 <span className="font-black text-yellow-900 leading-tight text-xs uppercase">Pago MP Pendiente</span>
                                 <span className="text-[10px] text-yellow-800 font-bold leading-none mt-1">Esperando validación</span>
                               </div>
                             )}
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold" onClick={() => handleStatusChange(order.id, "CANCELLED")}><Trash2 className="w-3 h-3 mr-1" /> Rechazar</Button>
                              <Button size="sm" className="flex-1 bg-yellow-500 hover:bg-yellow-600 font-bold text-white shadow-sm" onClick={() => handleStatusChange(order.id, "IN_PROCESS")}>Cocinar</Button>
                            </div>
                          </div>
                        )}

                        {col.id === "IN_PROCESS" && (
                          <div className="space-y-2">
                            {isDelivery ? (
                              <div className="flex gap-2">
                                <Select value={order.messengerId || "none"} onValueChange={v => handleMessengerChange(order.id, v)}>
                                  <SelectTrigger className="w-[120px] h-8 text-[10px] bg-slate-50 border-slate-200"><SelectValue placeholder="Repartidor" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Nadie</SelectItem>
                                    {messengers.filter(m => m.isActive || m.id === order.messengerId).map(m => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                                <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 font-bold text-white h-8" onClick={() => handleStatusChange(order.id, "PENDING_DELIVERY")}>A Reparto</Button>
                              </div>
                            ) : (
                              <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 font-bold text-white" onClick={() => handleStatusChange(order.id, "FINISHED")}>Terminado (Retira)</Button>
                            )}
                          </div>
                        )}

                        {col.id === "FINISHED" && (
                          <Button size="sm" variant="outline" className="w-full border-green-500 text-green-700 bg-green-50 font-bold hover:bg-green-600 hover:text-white" onClick={() => handleStatusChange(order.id, "DELIVERED")}><CheckCircle className="w-4 h-4 mr-1" /> Retirado ✅</Button>
                        )}

                        {col.id === "PENDING_DELIVERY" && order.messengerId === null && (
                          <Select value={order.messengerId !== null ? order.messengerId : "none"} onValueChange={(v) => handleMessengerChange(order.id, v)}>
                            <SelectTrigger className="w-full h-8 text-xs font-bold border-red-300 bg-red-50 text-red-700">
                              <SelectValue placeholder="Urgente: Asignar Repartidor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nadie</SelectItem>
                              {messengers.filter(m => m.isActive || m.id === order.messengerId).map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-slate-100 bg-slate-50">
                            <div className="p-4 text-sm space-y-4">
                              <div className="space-y-1">
                                <div className="flex gap-2 items-center text-slate-600">
                                  <Phone className="w-3 h-3" /><a href={`https://wa.me/${order.clientPhone.replace(/\D/g, '')}`} target="_blank" className="font-bold underline text-blue-600">{order.clientPhone}</a>
                                </div>
                                {isDelivery && <div className="flex gap-2 items-center text-slate-800 font-medium bg-orange-100/50 p-1.5 rounded"><Navigation className="w-3 h-3 text-orange-600" /> <span className="leading-tight">{order.deliveryAddress}</span></div>}
                                <div className="text-xs font-bold text-slate-500 pt-1 border-t mt-2">Día/Hora: {order.deliveryTime} • Via: {order.paymentMethod}</div>
                              </div>

                              <div className="space-y-2">
                                {order.items.map((item: any) => (
                                  <div key={item.id} className="bg-white border p-2 rounded-md leading-snug">
                                    <div className="font-black text-xs text-slate-800">{item.quantity}x {item.product.name}</div>
                                    {item.addedExtras?.length > 0 && <div className="text-[10px] text-green-700 font-medium">+{item.addedExtras.map((ex: any) => ex.extra.name).join(', ')}</div>}
                                    {item.removedIngredients?.length > 0 && <div className="text-[10px] text-red-600 font-medium">-Sin {item.removedIngredients.map((ing: any) => ing.ingredient.name).join(', ')}</div>}
                                    {item.notes && <div className="text-[10px] italic text-slate-500 mt-1">"{item.notes}"</div>}
                                  </div>
                                ))}
                                <div className="font-black text-right pr-2">Total: ${order.total.toLocaleString("es-AR")}</div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}