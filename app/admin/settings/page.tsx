import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { MessengerForm } from "./MessengerForm";

export default async function SettingsPage() {
  const config = await prisma.systemConfig.findFirst();
  const messengers = await prisma.messenger.findMany({
    orderBy: { name: 'asc' }
  });

  // Ensure default config exists
  const safeConfig = config || await prisma.systemConfig.create({
    data: { appName: "nfood", whatsappMessage: "Hola, tu pedido está: {{estado}}", isStoreOpen: true }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground">Administrar preferencias de la PWA, WhatsApp y Mensajeros.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Global Settings */}
        <div className="space-y-6">
          <SettingsForm initialConfig={safeConfig} />
        </div>

        {/* Messengers List */}
        <div className="space-y-6">
          <MessengerForm initialMessengers={messengers} />
        </div>
      </div>
    </div>
  );
}
