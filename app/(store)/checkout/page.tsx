"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createOrder, fetchConfig } from "@/app/actions/checkout";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const addressInputRef = useRef<HTMLInputElement>(null);

  const { items, getTotal, clearCart, dailyPrize } = useCartStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    needsDelivery: false,
    deliveryAddress: "",
    deliveryTime: "",
    paymentMethod: "CASH",
  });
  
  const [slots, setSlots] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetchConfig().then(cfg => {
       setConfig(cfg);
       if (cfg) {
         if (!cfg.paymentCash && cfg.paymentMp) setFormData(p => ({...p, paymentMethod: "MP"}));
         if (cfg.paymentCash && !cfg.paymentMp) setFormData(p => ({...p, paymentMethod: "CASH"}));
       }
    });

    fetch("/api/slots")
      .then(r => r.json())
      .then(d => {
        const available = d.filter((s:any) => s.available > 0);
        setSlots(available);
        if (available.length > 0) {
          setFormData(prev => ({ ...prev, deliveryTime: available[0].time }));
        }
      });
  }, []);

  useEffect(() => {
    import("@/app/actions/auth").then(({ fetchCurrentClient }) => {
       fetchCurrentClient().then(client => {
          if (client) {
             setFormData(prev => ({
                ...prev,
                clientName: client.name || prev.clientName,
                clientPhone: client.phone || prev.clientPhone
             }));
          }
       });
    });
  }, []);

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (items.length === 0 && !isSuccess) {
      router.push("/");
    }
  }, [items, router, isSuccess]);

  const subtotal = getTotal();
  const discountMultiplier = 1 - (config?.globalDiscount || 0) / 100;
  let discountedSubtotal = subtotal * discountMultiplier;
  
  let prizeDiscount = 0;
  if (dailyPrize) {
     if (dailyPrize.type === "PERCENT") {
         prizeDiscount = discountedSubtotal * (dailyPrize.value / 100);
     } else if (dailyPrize.type === "AMOUNT") {
         prizeDiscount = Math.min(discountedSubtotal, dailyPrize.value);
     }
     discountedSubtotal -= prizeDiscount;
  }
  
  const deliveryCost = formData.needsDelivery ? (config?.deliveryCost || 0) : 0; 
  const total = discountedSubtotal + deliveryCost;

  const validateAndSubmit = async () => {
    if (items.length === 0) return;

    let finalItems = [...items];
    if (dailyPrize?.type === "PRODUCT" && dailyPrize.product) {
       finalItems.push({
         id: 'prize',
         product: dailyPrize.product,
         quantity: 1,
         unitPrice: 0,
         subtotal: 0,
         notes: "PREMIO DE RULETA",
         removedIngredients: [],
         addedExtras: []
       } as any);
    }

    if (!formData.clientName || !formData.clientPhone) {
      toast.error("Datos incompletos", { description: "Por favor, ingresá tu nombre y teléfono." });
      return;
    }
    if (formData.needsDelivery && !formData.deliveryAddress) {
      toast.error("Dirección requerida", { description: "Por favor, ingresá tu dirección de envío." });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrder({ ...formData, items: finalItems, total });
      if (result.success) {
        setIsSuccess(true);
        clearCart();
        toast.success("¡Pedido enviado con éxito!", { description: "Cocina ya lo está preparando." });
        
        try {
           const audio = new Audio('https://www.myinstants.com/media/sounds/dinosaur-roar.mp3');
           audio.play();
        } catch(err) { console.error("Audio play failed"); }

        router.push(`/track/${result.orderId}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error("Lo sentimos", { description: "No pudimos procesar tu pedido. Intenta nuevamente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.needsDelivery) {
        // Show confirm modal
        setShowConfirmModal(true);
    } else {
        validateAndSubmit();
    }
  };

  const confirmNoDelivery = () => {
      setShowConfirmModal(false);
      validateAndSubmit();
  };

  const cancelNoDelivery = () => {
      setShowConfirmModal(false);
      setFormData({...formData, needsDelivery: true});
      setTimeout(() => addressInputRef.current?.focus(), 300);
  };

  if (items.length === 0) return null;

  return (
    <>
      <div className="max-w-xl mx-auto pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
           <button type="button" onClick={() => router.back()} className="w-10 h-10 bg-white border outline-none shadow-sm rounded-full flex items-center justify-center active:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
           </button>
           <div>
             <h1 className="text-2xl font-black tracking-tight text-slate-800 leading-none">Datos del pedido</h1>
           </div>
        </div>

        <div className="bg-white border sm:rounded-3xl shadow-lg shadow-slate-200/50 p-4 sm:p-6 space-y-6">
          <form onSubmit={handlePreSubmit} className="space-y-4">
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-slate-700 font-bold text-sm ml-1 mb-1 block">Nombre y Apellido</Label>
                <Input 
                  id="name" 
                  required 
                  autoFocus
                  className="h-10 rounded-xl bg-slate-50 border-transparent focus:border-orange-500 focus:bg-white transition-colors"
                  placeholder="Ej. Juan Pérez" 
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-slate-700 font-bold text-sm ml-1 mb-1 block">Teléfono (WhatsApp)</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  required 
                  className="h-10 rounded-xl bg-slate-50 border-transparent focus:border-orange-500 focus:bg-white transition-colors"
                  placeholder="Ej. 1123456789" 
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Label htmlFor="delivery-toggle" className="font-bold cursor-pointer text-slate-800">
                  ¿Necesitás envío?
                </Label>
                <Switch 
                  id="delivery-toggle" 
                  checked={formData.needsDelivery}
                  onCheckedChange={(c) => setFormData({...formData, needsDelivery: c})}
                  className="data-[state=checked]:bg-orange-500"
                />
              </div>

              <AnimatePresence>
                {formData.needsDelivery && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    <Label htmlFor="address" className="text-slate-700 font-bold text-sm ml-1 mb-1 block">Dirección de envío</Label>
                    <Input 
                      id="address" 
                      required={formData.needsDelivery}
                      ref={addressInputRef}
                      className="h-10 rounded-xl bg-slate-50 border-transparent focus:border-orange-500 focus:bg-white transition-colors"
                      placeholder="Calle, Altura, Departamento..." 
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <Label className="font-bold text-slate-800 text-sm ml-1">Horario de {formData.needsDelivery ? 'entrega' : 'retiro'}</Label>
              {slots.length > 0 ? (
                <select 
                  required
                  className="h-10 w-full rounded-xl bg-slate-50 border border-transparent focus:border-orange-500 focus:bg-white transition-colors px-3 font-medium outline-none text-sm"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})}
                >
                  {slots.map(s => (
                    <option key={s.id} value={s.time}>{s.time} hs (Quedan {s.available} disp.)</option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 font-medium">
                  No hay horarios disponibles por el momento.
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <Label className="font-bold text-slate-800 text-sm ml-1">Método de pago</Label>
              <select 
                  required
                  className="h-10 w-full rounded-xl bg-slate-50 border border-transparent focus:border-orange-500 focus:bg-white transition-colors px-3 font-medium outline-none text-sm"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
              >
                 {config?.paymentCash !== false && <option value="CASH">Efectivo al recibir/retirar</option>}
                 {config?.paymentMp !== false && <option value="MP">MercadoPago (Transferencia / Link)</option>}
              </select>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-6 space-y-1">
              <div className="flex justify-between text-slate-500 font-medium text-xs">
                <span>Subtotal en Carrito</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              {config?.globalDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-bold text-xs items-center">
                  <span>Descuento Especial ({config.globalDiscount}%)</span>
                  <span>-${((subtotal * (config.globalDiscount/100))).toLocaleString('es-AR')}</span>
                </div>
              )}
              {dailyPrize && dailyPrize.type !== "PRODUCT" && (
                <div className="flex justify-between text-purple-600 font-bold text-xs items-center bg-purple-50 p-1 rounded">
                  <span>✨ Premio Ruleta ({dailyPrize.type === "PERCENT" ? `${dailyPrize.value}%` : `$${dailyPrize.value}`})</span>
                  <span>-${prizeDiscount.toLocaleString('es-AR')}</span>
                </div>
              )}
              {dailyPrize && dailyPrize.type === "PRODUCT" && (
                <div className="flex justify-between text-purple-600 font-bold text-xs items-center bg-purple-50 p-1 rounded">
                  <span>✨ Premio Ruleta: {dailyPrize.product?.name}</span>
                  <span>GRATIS</span>
                </div>
              )}
              {formData.needsDelivery && (
                <div className="flex justify-between text-slate-500 font-medium text-xs items-center">
                  <span>Costo de envío</span>
                  <span>${deliveryCost.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-xl pt-2 border-t border-slate-200 text-slate-800 mt-1">
                <span>Total a Pagar</span>
                <span className="text-orange-600">${total.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl text-lg font-bold bg-orange-500 active:bg-orange-600 text-white shadow-lg shadow-orange-500/20 group transition-all"
              disabled={isSubmitting || slots.length === 0}
            >
              {isSubmitting ? "Enviando..." : "Confirmar Pedido"}
              {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5"
             >
                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto">
                   <MapPin className="w-8 h-8" />
                </div>
                <div className="text-center">
                   <h3 className="text-xl font-black text-slate-800 mb-2">¿Sin Envío?</h3>
                   <p className="text-sm text-slate-500 leading-tight">Estás por finalizar el pedido e indicaste que lo pasás a retirar por el local. ¿Es correcto?</p>
                </div>
                <div className="space-y-2 pt-2">
                   <Button onClick={confirmNoDelivery} className="w-full h-12 rounded-xl bg-orange-500 font-bold text-white">Sí, retiro en local</Button>
                   <Button onClick={cancelNoDelivery} variant="outline" className="w-full h-12 rounded-xl font-bold border-slate-200">No, quiero pedir envío</Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
