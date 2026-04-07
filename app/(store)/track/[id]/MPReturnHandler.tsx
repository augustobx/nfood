"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { cancelOrderFromMP } from "@/app/actions/checkout";
import { useCartStore } from "@/lib/store";

export default function MPReturnHandler({ status, orderId }: { status?: string, orderId: string }) {
  const clearCart = useCartStore(state => state.clearCart);

  useEffect(() => {
    const handleMP = async () => {
      const memoryKey = `mp_checkout_${orderId}`;
      const isApproved = status === "approved" || status === "success";

      if (isApproved) {
        // Successful payment, let's play sound and clear memory
        sessionStorage.removeItem(memoryKey);
        clearCart();
        toast.success("¡Pago Confirmado!", { description: "Mercado Pago ha validado el pago con éxito. ¡Gracias!" });
        try {
          const audio = new Audio("https://www.myinstants.com/media/sounds/dinosaur-roar.mp3");
          audio.play();
        } catch (err) {
          console.error("Audio block", err);
        }
      } else {
        // Not approved. Either they arrived directly (e.g. tracking link) 
        // OR they just hit "Back" from MP (the memoryKey is still alive).
        if (sessionStorage.getItem(memoryKey)) {
           // They came back from MP uncompleted!
           sessionStorage.removeItem(memoryKey);
           toast.error("Pago Cancelado", { description: "Has salido de Mercado Pago o no pudimos validar el pago en tiempo real." });
           await cancelOrderFromMP(orderId);
           window.location.reload();
        }
      }
    };
    
    handleMP();
  }, [status, orderId]);
  return null;
}
