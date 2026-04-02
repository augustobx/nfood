"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, dailyPrize } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4 max-w-sm mx-auto">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-orange-100 p-8 rounded-full mb-4 shadow-inner">
          <ShoppingBag className="h-16 w-16 text-orange-500" />
        </motion.div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800">Carrito vacío</h1>
        <p className="text-muted-foreground text-lg">Todavía no agregaste nada a tu carrito. ¡Echá un vistazo a nuestro delicioso menú!</p>
        <Button onClick={() => router.push("/")} size="lg" className="mt-8 bg-orange-500 hover:bg-orange-600 rounded-full h-14 px-8 text-lg font-bold w-full shadow-lg shadow-orange-500/30">
          Ver el Menú
        </Button>
      </div>
    );
  }

  const subtotal = getTotal();

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 text-slate-800">
         <button onClick={() => router.push("/")} className="w-10 h-10 bg-white border shadow-sm rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
         </button>
         <div>
           <h1 className="text-3xl font-black tracking-tight">Tu Orden</h1>
           <p className="text-muted-foreground text-sm font-medium">Revisá tus productos seleccionados.</p>
         </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={item.id} 
              className="p-5 flex flex-col sm:flex-row gap-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-24 h-24 relative bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border">
                {item.product.imageUrl && item.product.showImage ? (
                  <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" sizes="96px" />
                ) : (
                  <ShoppingBag className="w-8 h-8 text-slate-300" />
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-lg leading-tight text-slate-800">
                    {item.isHalfAndHalf ? `Mitad ${item.product.name} / ${item.secondHalfProduct?.name}` : item.product.name}
                  </h3>
                  <p className="font-black text-lg text-orange-600 whitespace-nowrap">${item.subtotal.toLocaleString('es-AR')}</p>
                </div>
                
                {item.quantity > 1 && (
                  <p className="text-xs text-muted-foreground font-medium mb-1">${item.unitPrice.toLocaleString('es-AR')} c/u</p>
                )}

                {(item.removedIngredients.length > 0 || item.addedExtras.length > 0 || (item.comboRemovedIngredients && Object.keys(item.comboRemovedIngredients).length > 0)) && (
                  <div className="text-xs text-slate-500 font-medium py-1">
                    {item.addedExtras.map((ex: any) => (
                      <span key={ex.id} className="inline-block bg-green-50 text-green-700 px-1.5 py-0.5 rounded mr-1 mb-1">+ {ex.name}</span>
                    ))}
                    {item.removedIngredients.length > 0 && (
                      <span className="inline-block bg-red-50 text-red-700 px-1.5 py-0.5 rounded mr-1 mb-1">Sin alg. ingredientes</span>
                    )}
                    {item.comboRemovedIngredients && Object.keys(item.comboRemovedIngredients).some(k => item.comboRemovedIngredients![k].length > 0) && (
                      <span className="inline-block bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded mr-1 mb-1">Combo modificado</span>
                    )}
                  </div>
                )}
                
                {item.notes && (
                  <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg border">"{item.notes}"</p>
                )}

                <div className="flex items-center justify-between pt-4 mt-auto">
                  <div className="flex items-center gap-1 bg-slate-50 border p-1 rounded-full shadow-sm">
                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                       <Minus className="w-4 h-4 text-slate-600" />
                    </Button>
                    <span className="w-6 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                       <Plus className="w-4 h-4 text-slate-600" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-3 rounded-full font-bold" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4 mr-1.5" /> Quitar
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-8 bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
         {dailyPrize && (
            <div className="flex items-center justify-between font-bold text-sm bg-purple-100 text-purple-700 p-2 rounded-xl mb-2">
               <span>✨ Premio Ruleta Ganado:</span>
               <span>{dailyPrize.type === "PRODUCT" ? `+ ${dailyPrize.product?.name}` : dailyPrize.type === "PERCENT" ? `${dailyPrize.value}% OFF extra` : `-$${dailyPrize.value} extra`}</span>
            </div>
         )}
         <div className="flex items-center justify-between">
           <h3 className="text-xl font-bold text-slate-800">Costo Subtotal</h3>
           <span className="text-3xl font-black text-orange-600">${subtotal.toLocaleString('es-AR')}</span>
         </div>
      </div>

      <div className="mt-8">
        <Button 
          onClick={() => router.push("/checkout")}
          className="w-full h-16 rounded-[2rem] text-xl font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-500/20 group transition-all"
        >
          Siguiente: Ingresar Datos
          <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
