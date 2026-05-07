import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleIncomingMessage } from "@/lib/whatsapp-bot";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode && token) {
    const config = await prisma.systemConfig.findFirst();
    if (config && mode === "subscribe" && token === config.metaVerifyToken) {
      console.log("WEBHOOK_VERIFIED");
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Comprobar que es un evento de la API de WhatsApp Business
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            for (const message of change.value.messages) {
              const phone = message.from; // Teléfono del usuario
              
              // Evitar procesar mensajes que no tengan contenido soportado
              if (message.type === "text" || message.type === "interactive") {
                // Ejecutar la lógica del bot de manera asíncrona sin bloquear la respuesta
                handleIncomingMessage(phone, message).catch(err => {
                  console.error("Error en handleIncomingMessage:", err);
                });
              }
            }
          }
        }
      }
      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    } else {
      return new NextResponse("Not Found", { status: 404 });
    }
  } catch (error) {
    console.error("Webhook POST Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
