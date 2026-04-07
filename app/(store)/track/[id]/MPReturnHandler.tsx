"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { cancelOrderFromMP } from "@/app/actions/checkout";
import { useCartStore } from "@/lib/store";

export default function MPReturnHandler({ status, orderId, mpStart, mpUrl }: { status?: string, orderId: string, mpStart?: string, mpUrl?: string }) {
  const clearCart = useCartStore(state => state.clearCart);

  useEffect(() => {
    const handleMP = async () => {
      const memoryKey = `mp_jump_${orderId}`;

      // 1. MP SUCCESS FLIGHT
      if (status === "approved" || status === "success") {
        sessionStorage.removeItem(memoryKey);
        clearCart();
        toast.success("¡Pago Confirmado!", { description: "Mercado Pago ha validado el pago." });
        try { new Audio("https://www.myinstants.com/media/sounds/dinosaur-roar.mp3").play(); } catch(e){}
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
  return null;
}
