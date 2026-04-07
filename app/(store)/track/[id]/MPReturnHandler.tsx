"use client";
import { useEffect } from "react";
import { toast } from "sonner";

export default function MPReturnHandler({ status }: { status: string }) {
  useEffect(() => {
    if (status === "approved") {
      toast.success("¡Pago Confirmado!", { description: "Mercado Pago ha validado el pago con éxito. ¡Gracias!" });
      try {
        const audio = new Audio("https://www.myinstants.com/media/sounds/dinosaur-roar.mp3");
        audio.play();
      } catch (err) {
        console.error("Audio block", err);
      }
    }
  }, [status]);
  return null;
}
