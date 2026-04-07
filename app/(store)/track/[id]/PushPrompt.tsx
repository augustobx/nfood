"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BellRing, Check, Info, Copy } from "lucide-react";
import { toast } from "sonner";

// Utility to convert Base64 string to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushPrompt({ orderId, clientId }: { orderId?: string, clientId?: string }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isChromeIOS, setIsChromeIOS] = useState(false);

  useEffect(() => {
    // Check if Push is supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);

      // Check existing subscription
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            setIsSubscribed(true);

            // ¡EL PARCHE SILENCIOSO!
            // Si el dispositivo ya estaba suscrito, actualizamos el backend 
            // con el ID de este nuevo pedido sin que el usuario tenga que tocar nada.
            fetch('/api/webpush/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription: sub,
                orderId,
                clientId
              })
            }).catch(e => console.error("Error actualizando subscripción silenciosa:", e));
          }
        });
      });
    }

    // Check iOS and Standalone (PWA)
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);

    // Detectar si es Chrome o un navegador in-app en iOS
    setIsChromeIOS(ios && (/CriOS/.test(navigator.userAgent) || /FBAV|FBAN|Instagram/.test(navigator.userAgent)));
  }, [orderId, clientId]); // <-- Es vital que estén en las dependencias del hook

  const subscribePush = async () => {
    try {
      setLoading(true);

      if (!('Notification' in window)) {
        toast.error("Navegador no soportado", { description: "Tu dispositivo o navegador no soporta notificaciones web nativas." });
        setLoading(false);
        return;
      }

      const permItem = await Notification.requestPermission();
      if (permItem !== 'granted') {
        toast.error("Permiso denegado", { description: "Deberás habilitar las notificaciones desde los ajustes del navegador." });
        setLoading(false);
        return;
      }

      // 1. Get VAPID public key from backend
      const vapidRes = await fetch('/api/webpush/vapid');
      const vapidData = await vapidRes.json();

      if (!vapidData.publicKey) {
        toast.error("Error", { description: "El servidor aún no configuró las notificaciones." });
        setLoading(false);
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);

      // 2. Subscribe from Service Worker
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // 3. Send subscription to backend
      const res = await fetch('/api/webpush/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          orderId,
          clientId
        })
      });

      if (res.ok) {
        setIsSubscribed(true);
        toast.success("¡Excelente!", { description: "Enviaremos una notificación PUSH apenas tu pedido cambie de estado." });
      } else {
        toast.error("Error al registrar", { description: "No pudimos guardar tu suscripción en este momento." });
      }
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión", { description: "No fue posible configurar las notificaciones nativas." });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("¡Link copiado con éxito!", {
      description: "Abrí Safari, pegalo en la barra de direcciones y tocá Compartir > Añadir a Inicio."
    });
  };

  if (!isSupported) return null;
  if (isSubscribed) {
    return (
      <div className="bg-green-50 text-green-700 p-4 border border-green-200 rounded-xl flex items-center justify-center gap-2 font-medium">
        <Check className="w-5 h-5 text-green-600" />
        Notificaciones de estado activadas
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-orange-200 shadow-sm p-5 rounded-2xl space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
          <BellRing className="w-6 h-6 text-orange-600 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Rastreo en Tiempo Real</h3>
          <p className="text-sm text-slate-500 leading-tight mt-1">¿Querés recibir un aviso instántaneo en este dispositivo cuando tu pedido esté en camino o terminado?</p>
        </div>
      </div>

      {isIOS && (!isStandalone || isChromeIOS) ? (
        <div className="bg-blue-50 text-blue-800 text-xs p-4 rounded-xl flex flex-col gap-3">
          <div className="flex gap-2">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
            <p className="leading-relaxed">
              Estás en <strong>iPhone</strong>. Para recibir notificaciones debés instalar la app exclusivamente desde <strong>Safari</strong> (botón Compartir y <strong>Añadir a Inicio</strong>).
              {isChromeIOS && " Si instalaste la app usando Chrome o desde otra red social, por favor eliminala primero."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="w-full bg-white hover:bg-blue-100 border-blue-200 text-blue-700 font-semibold mt-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar link para abrir en Safari
          </Button>
        </div>
      ) : (
        <Button
          onClick={subscribePush}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-12 rounded-xl"
        >
          Tocar P/ Recibir Notificaciones
        </Button>
      )}
    </div>
  );
}