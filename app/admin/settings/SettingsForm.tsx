"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateConfig } from "@/app/actions/admin-settings";
import { Save } from "lucide-react";

export function SettingsForm({ initialConfig }: { initialConfig: any }) {
  const [isStoreOpen, setIsStoreOpen] = useState(initialConfig.isStoreOpen);
  const [whatsappMessage, setWhatsappMessage] = useState(initialConfig.whatsappMessage);
  const [isSaving, setIsSaving] = useState(false);


  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateConfig(initialConfig.id, { isStoreOpen, whatsappMessage });
    if (result.success) {
      toast.success("Guardado exitosamente");
    } else {
      toast.error("Error", { description: result.error });
    }
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajustes Generales</CardTitle>
        <CardDescription>Controla el estado de tu local y plantillas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between border rounded-lg p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Local Abierto</Label>
            <p className="text-sm text-muted-foreground">Permite a los clientes enviar pedidos vÍa web.</p>
          </div>
          <Switch checked={isStoreOpen} onCheckedChange={setIsStoreOpen} />
        </div>

        <div className="space-y-2 border rounded-lg p-4 bg-slate-50">
          <Label>Mensaje de WhatsApp</Label>
          <p className="text-xs text-muted-foreground pb-2">Usa {'{{estado}}'} para que se reemplace por el estado actual.</p>
          <Textarea 
            value={whatsappMessage} 
            onChange={(e) => setWhatsappMessage(e.target.value)}
            rows={4}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          <Save className="h-4 w-4 mr-2" /> Guardar Ajustes
        </Button>
      </CardFooter>
    </Card>
  );
}
