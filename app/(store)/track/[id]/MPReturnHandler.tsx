"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cancelOrderFromMP } from "@/app/actions/checkout";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function MPReturnHandler({ status, orderId, mpStart, mpUrl }: { status?: string, orderId: string, mpStart?: string, mpUrl?: string }) {
  const clearCart = useCartStore(state => state.clearCart);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  useEffect(() => {
    const handleMP = async () => {
      const memoryKey = `mp_jump_${orderId}`;

      // 1. MP SUCCESS FLIGHT
      if (status === "approved" || status === "success") {
        sessionStorage.removeItem(memoryKey); // safely clean it up
        clearCart();
        setShowSuccessOverlay(true);
        return;
      }

      // 2. MP INIT JUMP
      if (mpStart === "1" && mpUrl) {
         if (!sessionStorage.getItem(memoryKey)) {
             // We haven't jumped yet. Jump now!
             sessionStorage.setItem(memoryKey, "1");
             window.location.assign(mpUrl);
         } else {
             // We HAVE jumped. So hitting this again means the user pressed "Back" from Mercado Pago!
             sessionStorage.removeItem(memoryKey);
             toast.error("Pago Cancelado", { description: "Regresaste sin completar el pago." });
             await cancelOrderFromMP(orderId);
             window.location.href = `/track/${orderId}`; // Clean URL
         }
         return;
      }

      // 3. User landed here randomly or came from failure back_url without mpStart
      if (sessionStorage.getItem(memoryKey)) {
          sessionStorage.removeItem(memoryKey);
          toast.error("Pago Cancelado", { description: "Pago no completado." });
          await cancelOrderFromMP(orderId);
          window.location.reload();
      }
    };
    
    handleMP();
  }, [status, orderId, mpStart, mpUrl, clearCart]);

  if (showSuccessOverlay) {
     return (
       <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 text-center">
          <div className="space-y-6">
             <h2 className="text-3xl font-extrabold text-white">¡Pago Aprobado!</h2>
             <Button 
                onClick={() => {
                   setShowSuccessOverlay(false);
                   try { new Audio("https://www.myinstants.com/media/sounds/dinosaur-roar.mp3").play() } catch(e){}
                }}
                className="bg-green-600 hover:bg-green-500 text-white font-bold h-20 px-12 text-xl rounded-2xl animate-pulse"
             >
                Ver Mi Pedido
             </Button>
          </div>
       </div>
     );
  }

  return null;
}
