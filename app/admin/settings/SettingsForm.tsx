"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateConfig, broadcastPushNotification } from "@/app/actions/admin-settings";
import { Save, Store, Palette, Wallet, Megaphone, Send, Printer, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SettingsForm({ initialConfig }: { initialConfig: any }) {
  const [cfg, setCfg] = useState(initialConfig);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para el envío masivo PUSH
  const [promoTitle, setPromoTitle] = useState("");
  const [promoBody, setPromoBody] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const updateField = (field: string, value: any) => {
    setCfg((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const dataToSave = {
      appName: cfg.appName,
      isStoreOpen: cfg.isStoreOpen,
      closedMessage: cfg.closedMessage,
      whatsappMessage: cfg.whatsappMessage,
      primaryColor: cfg.primaryColor,
      secondaryColor: cfg.secondaryColor,
      splashEnabled: cfg.splashEnabled,
      splashDuration: Number(cfg.splashDuration),
      welcomeBalloonDuration: Number(cfg.welcomeBalloonDuration) || 0,
      deliveryCost: Number(cfg.deliveryCost) || 0,
      globalDiscount: Number(cfg.globalDiscount) || 0,
      splashUrl: cfg.splashUrl,
      logoUrl: cfg.logoUrl,
      welcomeBalloonEnabled: cfg.welcomeBalloonEnabled,
      welcomeBalloonText: cfg.welcomeBalloonText,
      paymentCash: cfg.paymentCash,
      paymentMp: cfg.paymentMp,
      autoPrintTickets: cfg.autoPrintTickets,
      backgroundUrl: cfg.backgroundUrl,
      backgroundBlur: cfg.backgroundBlur,
      mpAccessToken: cfg.mpAccessToken,
      mpPublicKey: cfg.mpPublicKey,

      // NUEVOS CAMPOS DE IMPRESORAS
      printerCounterName: cfg.printerCounterName,
      printerCounterSize: cfg.printerCounterSize || "80mm",
      printerKitchenName: cfg.printerKitchenName,
      printerKitchenSize: cfg.printerKitchenSize || "80mm",
    };

    const result = await updateConfig(cfg.id, dataToSave);
    if (result.success) {
      toast.success("Configuración general guardada");
    } else {
      toast.error("Error", { description: result.error });
    }
    setIsSaving(false);
  };

  const handleBroadcastPush = async () => {
    if (!promoTitle.trim() || !promoBody.trim()) {
      toast.error("Datos incompletos", { description: "Debe ingresar un título y un mensaje." });
      return;
    }

    if (!confirm("¿Está seguro de enviar esta notificación a TODOS los dispositivos suscritos?")) {
      return;
    }

    setIsBroadcasting(true);
    const res = await broadcastPushNotification(promoTitle, promoBody, "/");

    if (res.success) {
      toast.success("¡Notificaciones enviadas!", { description: res.message });
      setPromoTitle("");
      setPromoBody("");
    } else {
      toast.error("Fallo de envío", { description: res.error });
    }
    setIsBroadcasting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
          <Save className="h-5 w-5 mr-2" /> Guardar Todos los Cambios
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-slate-200">
          <TabsTrigger value="general"><Store className="w-4 h-4 mr-2" /> Negocio</TabsTrigger>
          <TabsTrigger value="finance"><Wallet className="w-4 h-4 mr-2" /> Pagos</TabsTrigger>
          <TabsTrigger value="mercadopago"><CreditCard className="w-4 h-4 mr-2" /> M. Pago</TabsTrigger>
          <TabsTrigger value="marketing"><Megaphone className="w-4 h-4 mr-2" /> Splash</TabsTrigger>
          <TabsTrigger value="theme"><Palette className="w-4 h-4 mr-2" /> Diseño</TabsTrigger>
          <TabsTrigger value="printers"><Printer className="w-4 h-4 mr-2" /> Impresoras</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ajustes de Operación</CardTitle>
              <CardDescription>Controla el estado principal de la app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre de la Aplicación (Título)</Label>
                  <Input value={cfg.appName} onChange={e => updateField('appName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Logo del NavBar (URL)</Label>
                  <Input placeholder="URL de la imagen (dejar vacío para usar el texto)" value={cfg.logoUrl || ''} onChange={e => updateField('logoUrl', e.target.value)} />
                  <p className="text-xs text-muted-foreground">Aparecerá en la barra superior en vez del texto clásico.</p>
                </div>
              </div>

              <div className="flex items-center justify-between border rounded-lg p-4 bg-slate-50">
                <div className="space-y-0.5">
                  <Label className="text-base text-slate-800 font-bold">Local Abierto (Aceptar Pedidos)</Label>
                  <p className="text-sm text-muted-foreground">Si se desactiva, los clientes verán el mensaje de cierre y no podrán comprar.</p>
                </div>
                <Switch checked={cfg.isStoreOpen} onCheckedChange={v => updateField('isStoreOpen', v)} />
              </div>

              {!cfg.isStoreOpen && (
                <div className="space-y-2">
                  <Label className="text-red-600 font-semibold">Mensaje de Local Cerrado</Label>
                  <Textarea value={cfg.closedMessage} onChange={e => updateField('closedMessage', e.target.value)} placeholder="Ej: Ya cerramos por hoy. Volvemos mañana a las 20hs." />
                </div>
              )}

              <div className="space-y-2 border-t pt-4">
                <Label>Mensaje de WhatsApp para notificaciones</Label>
                <p className="text-xs text-muted-foreground pb-2">Usa {'{{estado}}'} para insertar dinámicamente el estado del pedido.</p>
                <Textarea value={cfg.whatsappMessage} onChange={e => updateField('whatsappMessage', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagos, Envíos y Descuentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Costo de Envío Fijo ($)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Se sumará al total si eligen Delivery.</p>
                  <Input type="number" min="0" step="0.01" value={cfg.deliveryCost} onChange={e => updateField('deliveryCost', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-600">Descuento Global (%)</Label>
                  <p className="text-xs text-muted-foreground mb-2">0% desactiva el cartel. Por ej: 10% aplica a la tienda entera.</p>
                  <Input type="number" min="0" max="100" step="1" value={cfg.globalDiscount} onChange={e => updateField('globalDiscount', e.target.value)} />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="block text-base font-bold mb-2">Métodos de Pago Habitilitados</Label>

                <div className="flex items-center justify-between border rounded-lg p-3">
                  <Label>Efectivo (Pago al recibir/retirar)</Label>
                  <Switch checked={cfg.paymentCash} onCheckedChange={v => updateField('paymentCash', v)} />
                </div>

                <div className="flex items-center justify-between border rounded-lg p-3">
                  <Label>MercadoPago (Transferencia / Link)</Label>
                  <Switch checked={cfg.paymentMp} onCheckedChange={v => updateField('paymentMp', v)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mercadopago" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Integración Mercado Pago</CardTitle>
              <CardDescription>Credenciales de Producción de tu cuenta de Mercado Pago.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 bg-slate-50 p-4 border rounded-xl">
                <div className="space-y-2">
                  <Label className="font-bold">Access Token</Label>
                  <Input
                    type="password"
                    placeholder="APP_USR-..."
                    value={cfg.mpAccessToken || ''}
                    onChange={e => updateField('mpAccessToken', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Token privado necesario para generar los cobros.</p>
                </div>
                <div className="space-y-2 pt-2">
                  <Label className="font-bold">Public Key</Label>
                  <Input
                    placeholder="APP_USR-..."
                    value={cfg.mpPublicKey || ''}
                    onChange={e => updateField('mpPublicKey', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Clave pública de la aplicación.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Comunicaciones y Marketing</CardTitle>
              <CardDescription>Envío de Notificaciones PUSH y configuración visual de bienvenida.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* NOTIFICACIONES PUSH MASIVAS */}
              <div className="border border-blue-200 rounded-xl p-5 bg-blue-50/50 space-y-4">
                <div>
                  <Label className="text-lg font-bold text-blue-900 flex items-center gap-2">
                    <Send className="w-5 h-5" /> Envío Masivo de Notificaciones (Prueba/Promo)
                  </Label>
                  <p className="text-sm text-slate-600 mt-1">Enviará un Push instantáneo a todos los usuarios y dispositivos que hayan activado las notificaciones. Útil para testear o avisar de promociones.</p>
                </div>

                <div className="space-y-4 bg-white p-4 rounded-lg border shadow-sm">
                  <div className="space-y-2">
                    <Label>Título de la Notificación</Label>
                    <Input
                      placeholder="Ej: Prueba del Sistema / ¡20% de Descuento Hoy!"
                      value={promoTitle}
                      onChange={(e) => setPromoTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensaje (Cuerpo)</Label>
                    <Textarea
                      placeholder="Ej: Esta es una notificación de prueba. / Ingresá ahora para ver nuestras promos."
                      value={promoBody}
                      onChange={(e) => setPromoBody(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleBroadcastPush}
                    disabled={isBroadcasting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    {isBroadcasting ? "Enviando..." : "Enviar a todos los dispositivos"}
                  </Button>
                </div>
              </div>

              {/* SPLASH */}
              <div className="border rounded-xl p-4 bg-slate-50 space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-bold text-slate-800">Pantalla de Carga (Splash Screen)</Label>
                  <Switch checked={cfg.splashEnabled} onCheckedChange={v => updateField('splashEnabled', v)} />
                </div>
                {cfg.splashEnabled && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="space-y-2">
                      <Label>Imagen Animada del Logo (URL)</Label>
                      <Input placeholder="URL de la imagen (dejar en blanco para default 🍕)" value={cfg.splashUrl || ''} onChange={e => updateField('splashUrl', e.target.value)} />
                      <p className="text-xs text-muted-foreground">Recomendamos una imagen PNG transparente (aprox 200x200px).</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Tiempo de duración (Segundos)</Label>
                      <Input type="number" min="1" max="10" value={cfg.splashDuration} onChange={e => updateField('splashDuration', e.target.value)} />
                      <p className="text-xs text-slate-500">Muestra el logo animado antes de entrar a la tienda.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* BALLOON */}
              <div className="border rounded-xl p-4 bg-slate-50 space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-bold text-slate-800">Globo Pop-up de Bienvenida</Label>
                  <Switch checked={cfg.welcomeBalloonEnabled} onCheckedChange={v => updateField('welcomeBalloonEnabled', v)} />
                </div>
                {cfg.welcomeBalloonEnabled && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="space-y-2">
                      <Label>Mensaje del Globo</Label>
                      <Textarea value={cfg.welcomeBalloonText} onChange={e => updateField('welcomeBalloonText', e.target.value)} placeholder="¡Pedí por acá y ganá puntos!" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tiempo en pantalla (Segundos)</Label>
                      <Input type="number" min="1" max="20" value={cfg.welcomeBalloonDuration} onChange={e => updateField('welcomeBalloonDuration', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalización de Color</CardTitle>
              <CardDescription>Se inyectarán como variables de Tailwind y CSS Global nativo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label>Color Primario (Acentos y Botones Ppal)</Label>
                  <div className="flex gap-4">
                    <Input type="color" className="p-1 h-12 w-24 cursor-pointer" value={cfg.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} />
                    <Input type="text" className="h-12 w-32 font-mono uppercase" value={cfg.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Color Secundario (Detalles)</Label>
                  <div className="flex gap-4">
                    <Input type="color" className="p-1 h-12 w-24 cursor-pointer" value={cfg.secondaryColor} onChange={e => updateField('secondaryColor', e.target.value)} />
                    <Input type="text" className="h-12 w-32 font-mono uppercase" value={cfg.secondaryColor} onChange={e => updateField('secondaryColor', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6 mt-6 pb-6">
                <h4 className="font-bold">Fondo General de la App (Background)</h4>
                <div className="space-y-2">
                  <Label>URL de Imagen de Fondo</Label>
                  <Input placeholder="Ej: https://.../fondo.jpg (Dejar vacío para bloque liso)" value={cfg.backgroundUrl || ''} onChange={e => updateField('backgroundUrl', e.target.value)} />
                </div>
                {cfg.backgroundUrl && (
                  <div className="flex items-center justify-between border rounded-lg p-3 bg-slate-50">
                    <Label>Efecto de Desfoque Oscuro (Blur + Opacity)</Label>
                    <Switch checked={cfg.backgroundBlur || false} onCheckedChange={v => updateField('backgroundBlur', v)} />
                  </div>
                )}
              </div>

              <div className="mt-8 p-6 rounded-2xl border" style={{ backgroundColor: '#f8fafc' }}>
                <h4 className="font-bold mb-4">Vista Recreada</h4>
                <div className="flex gap-4">
                  <Button style={{ backgroundColor: cfg.primaryColor, color: 'white' }}>Botón Principal</Button>
                  <Button variant="outline" style={{ borderColor: cfg.secondaryColor, color: cfg.secondaryColor }}>Secundario</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PESTAÑA IMPRESORAS */}
        <TabsContent value="printers" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Impresoras Físicas</CardTitle>
              <CardDescription>Ajustes para la impresión térmica de comandas (Cocina) y tickets (Mostrador).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              <div className="flex items-center justify-between border-2 border-orange-200 rounded-xl p-4 bg-orange-50">
                <div className="space-y-0.5">
                  <Label className="text-base text-slate-800 font-bold">Auto-Impresión de Tickets</Label>
                  <p className="text-sm text-muted-foreground">Si está activado, la app le dirá a tu servidor local de Node.js que imprima automáticamente cuando ingresa un pedido nuevo.</p>
                </div>
                <Switch checked={cfg.autoPrintTickets} onCheckedChange={v => updateField('autoPrintTickets', v)} />
              </div>

              {/* Impresora Mostrador */}
              <div className="space-y-4 p-5 border rounded-xl bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <Printer className="w-5 h-5 text-blue-600" /> Impresora de Mostrador (Tickets)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre de la impresora (OS)</Label>
                    <Input placeholder="Ej: POS-58C, XP-80C..." value={cfg.printerCounterName || ''} onChange={e => updateField('printerCounterName', e.target.value)} />
                    <p className="text-xs text-muted-foreground leading-tight">Debe coincidir exactamente con el nombre instalado en Windows/Linux.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Ancho del Rollo de Papel</Label>
                    <Select value={cfg.printerCounterSize || "80mm"} onValueChange={v => updateField('printerCounterSize', v)}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar medida" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="58mm">58mm (Rollos angostos)</SelectItem>
                        <SelectItem value="80mm">80mm (Rollos estándar de ticketadora)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Impresora Cocina */}
              <div className="space-y-4 p-5 border rounded-xl bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <Printer className="w-5 h-5 text-orange-600" /> Impresora de Cocina (Comandas)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre de la impresora (OS)</Label>
                    <Input placeholder="Ej: Cocina-80..." value={cfg.printerKitchenName || ''} onChange={e => updateField('printerKitchenName', e.target.value)} />
                    <p className="text-xs text-muted-foreground leading-tight">Debe coincidir exactamente con el nombre instalado en Windows/Linux.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Ancho del Rollo de Papel</Label>
                    <Select value={cfg.printerKitchenSize || "80mm"} onValueChange={v => updateField('printerKitchenSize', v)}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar medida" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="58mm">58mm (Rollos angostos)</SelectItem>
                        <SelectItem value="80mm">80mm (Rollos estándar de ticketadora)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}