"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { cancelOrderFromMP } from "@/app/actions/checkout";

export default function MPReturnHandler({ status, isStart, orderId }: { status?: string, isStart?: boolean, orderId: string }) {
  useEffect(() => {
    const handleMP = async () => {
      if (isStart) {
         const mpUrl = sessionStorage.getItem(`mp_init_${orderId}`);
         if (mpUrl) {
            sessionStorage.removeItem(`mp_init_${orderId}`);
            sessionStorage.setItem(`mp_attempt_${orderId}`, "1");
            window.location.replace(mpUrl);
         } else if (sessionStorage.getItem(`mp_attempt_${orderId}`)) {
            // El usuario hizo BACK desde Mercado Pago y no pagó.
            toast.error("Pago Cancelado", { description: "Has salido de Mercado Pago sin completar el pago." });
            await cancelOrderFromMP(orderId);
            window.location.reload();
         }
      }

      if (status === "approved" || status === "success") {
        toast.success("¡Pago Confirmado!", { description: "Mercado Pago ha validado el pago con éxito. ¡Gracias!" });
        try {
          const audio = new Audio("https://www.myinstants.com/media/sounds/dinosaur-roar.mp3");
          audio.play();
        } catch (err) {
          console.error("Audio block", err);
        }
      }
    };
    
    handleMP();
  }, [status, isStart, orderId]);
  return null;
}
