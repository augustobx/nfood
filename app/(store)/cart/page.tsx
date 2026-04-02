"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { createOrder } from "@/app/actions/checkout";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();

  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    needsDelivery: false,
    deliveryAddress: "",
    deliveryTime: "Lo antes posible",
    paymentMethod: "CASH",
  });

  const subtotal = getTotal();
  const deliveryCost = formData.needsDelivery ? 500 : 0; // Fixed delivery cost example
  const total = subtotal + deliveryCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

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
      const result = await createOrder({
        ...formData,
        items,
        total
      });

      if (result.success) {
        clearCart();
        toast.success("Pedido enviado", { description: "Recibimos tu pedido correctamente." });
        router.push(`/track/${result.orderId}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error("Error", { description: "No pudimos procesar tu pedido. Intenta nuevamente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div className="bg-orange-100 p-6 rounded-full mb-4">
          <ShoppingBag className="h-12 w-12 text-orange-400" />
        </div>
        <h1 className="text-3xl font-bold">Carrito vacío</h1>
        <p className="text-muted-foreground text-lg max-w-md">Todavía no agregaste nada a tu carrito. ¡Echá un vistazo a nuestro menú!</p>
        <Button onClick={() => router.push("/")} size="lg" className="mt-4 bg-black">Ir al Menú</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-in fade-in duration-300">
      {/* Left Column: Cart Items */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Tu Pedido</h1>
          <p className="text-muted-foreground">Revisá los productos que agregaste antes de confirmar.</p>
        </div>

        <div className="divide-y border rounded-xl bg-white overflow-hidden shadow-sm">
          {items.map((item) => (
            <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
              <div className="w-24 h-24 relative bg-muted rounded-md flex-shrink-0">
                {item.product.imageUrl ? (
                  <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover rounded-md" />
                ) : (
                  <ShoppingBag className="w-8 h-8 m-auto mt-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{item.product.name}</h3>
                  <p className="font-bold whitespace-nowrap">${item.subtotal.toLocaleString('es-AR')}</p>
                </div>
                
                {item.quantity > 1 && (
                  <p className="text-sm text-muted-foreground">${item.unitPrice.toLocaleString('es-AR')} c/u</p>
                )}

                {(item.removedIngredients.length > 0 || item.addedExtras.length > 0) && (
                  <div className="text-sm text-muted-foreground pt-1 pb-2">
                    {item.addedExtras.map(ex => (
                      <span key={ex.id} className="block text-orange-600">+ {ex.name}</span>
                    ))}
                    {item.removedIngredients.length > 0 && (
                      <span className="block italic">Sin algunos ingredientes</span>
                    )}
                  </div>
                )}
                
                {item.notes && (
                  <p className="text-sm text-gray-500 italic mt-1 pb-2">"{item.notes}"</p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 bg-muted p-1 rounded-full">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>-</Button>
                    <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive h-8 px-2" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Quitar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Checkout Form */}
      <div className="lg:col-span-5 relative">
        <div className="sticky top-20 bg-white border rounded-xl shadow-sm overflow-hidden p-6 sm:p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-6">Completá tus datos</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre y Apellido</Label>
                  <Input 
                    id="name" 
                    required 
                    autoFocus
                    placeholder="Ej. Juan Pérez" 
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    required 
                    placeholder="Ej. 1123456789" 
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                  />
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="delivery-toggle" className="text-base font-semibold cursor-pointer">
                    ¿Necesitás envío?
                  </Label>
                  <Switch 
                    id="delivery-toggle" 
                    checked={formData.needsDelivery}
                    onCheckedChange={(c) => setFormData({...formData, needsDelivery: c})}
                  />
                </div>

                {formData.needsDelivery && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="address">Dirección de envío</Label>
                    <Input 
                      id="address" 
                      required={formData.needsDelivery}
                      placeholder="Calle, Altura, Departamento..." 
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-6 space-y-4">
                <Label className="text-base font-semibold">Método de pago</Label>
                <RadioGroup 
                  defaultValue="CASH" 
                  value={formData.paymentMethod}
                  onValueChange={(v) => setFormData({...formData, paymentMethod: v})}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="CASH" id="cash" className="peer sr-only" />
                    <Label
                      htmlFor="cash"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      Efectivo
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="MP" id="mp" className="peer sr-only" />
                    <Label
                      htmlFor="mp"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500"
                    >
                      MercadoPago
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="border-t pt-6 pb-2 space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-AR')}</span>
                </div>
                {formData.needsDelivery && (
                  <div className="flex justify-between text-muted-foreground items-center">
                    <span>Costo de envío (Aprox)</span>
                    <span>${deliveryCost.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl pt-2 border-t">
                  <span>Total</span>
                  <span className="text-orange-600">${total.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-14 text-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-600/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Procesando..." : "Confirmar Pedido"}
                {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
