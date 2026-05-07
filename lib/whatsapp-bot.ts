import { prisma } from "@/lib/prisma";

// Tipos para los mensajes interactivos
interface Button {
  type: "reply";
  reply: {
    id: string;
    title: string;
  };
}

export class WhatsAppBot {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  // Enviar mensaje de texto simple
  async sendText(to: string, text: string) {
    return this.sendRequest({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: text }
    });
  }

  // Enviar botones (Quick Replies, max 3)
  async sendButtons(to: string, text: string, buttons: { id: string; title: string }[]) {
    return this.sendRequest({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text },
        action: {
          buttons: buttons.map(b => ({
            type: "reply",
            reply: { id: b.id, title: b.title.substring(0, 20) }
          }))
        }
      }
    });
  }

  // Enviar lista (max 10 opciones por sección)
  async sendList(to: string, text: string, buttonText: string, title: string, rows: { id: string; title: string; description?: string }[]) {
    return this.sendRequest({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: title.substring(0, 60) },
        body: { text: text.substring(0, 1024) },
        action: {
          button: buttonText.substring(0, 20),
          sections: [
            {
              rows: rows.map(r => ({
                id: r.id,
                title: r.title.substring(0, 24),
                description: r.description ? r.description.substring(0, 72) : undefined
              }))
            }
          ]
        }
      }
    });
  }

  private async sendRequest(payload: any) {
    if (!this.config.metaApiToken || !this.config.metaPhoneNumberId) return;

    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${this.config.metaPhoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.metaApiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("WhatsApp API Error:", data);
      }
      return data;
    } catch (error) {
      console.error("Fetch error to WhatsApp API:", error);
    }
  }
}

// State machine
export async function handleIncomingMessage(phone: string, message: any) {
  const config = await prisma.systemConfig.findFirst();
  if (!config || !config.whatsappBotEnabled) return;

  const bot = new WhatsAppBot(config);
  
  // Extraer el texto o ID del botón/lista
  let incomingText = "";
  let payloadId = "";

  if (message.type === "text") {
    incomingText = message.text.body;
  } else if (message.type === "interactive") {
    if (message.interactive.type === "button_reply") {
      payloadId = message.interactive.button_reply.id;
      incomingText = message.interactive.button_reply.title;
    } else if (message.interactive.type === "list_reply") {
      payloadId = message.interactive.list_reply.id;
      incomingText = message.interactive.list_reply.title;
    }
  }

  if (!incomingText && !payloadId) return;

  // Cargar sesión
  let session = await prisma.whatsAppSession.findUnique({ where: { phone } });
  
  if (!session || incomingText.toLowerCase() === "hola" || incomingText.toLowerCase() === "menu") {
    session = await prisma.whatsAppSession.upsert({
      where: { phone },
      update: { state: "GREETING", cart: [], tempData: {} },
      create: { phone, state: "GREETING", cart: [], tempData: {} }
    });
  }

  // Helper para actualizar sesión
  const updateSession = async (state: string, tempData?: any, cart?: any) => {
    await prisma.whatsAppSession.update({
      where: { phone },
      data: {
        state,
        tempData: tempData !== undefined ? tempData : session!.tempData,
        cart: cart !== undefined ? cart : session!.cart
      }
    });
  };

  const state = session.state;
  const cart: any[] = (session.cart as any[]) || [];
  const tempData: any = session.tempData || {};

  try {
    switch (state) {
      case "GREETING":
        const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { sequence: 'asc' } });
        if (categories.length === 0) {
          await bot.sendText(phone, "Lo sentimos, el menú no está disponible en este momento.");
          return;
        }
        
        await bot.sendList(
          phone,
          "¡Hola! Bienvenido a " + config.appName + ". Por favor elige una categoría:",
          "Ver Categorías",
          "Menú",
          categories.slice(0, 10).map(c => ({ id: `cat_${c.id}`, title: c.name }))
        );
        await updateSession("BROWSING_CATEGORY");
        break;

      case "BROWSING_CATEGORY":
        if (payloadId.startsWith("cat_")) {
          const categoryId = payloadId.replace("cat_", "");
          const products = await prisma.product.findMany({
            where: { categoryId, isActive: true },
            select: { id: true, name: true, basePrice: true, description: true }
          });

          if (products.length === 0) {
            await bot.sendText(phone, "No hay productos en esta categoría. Escribe 'menu' para volver.");
            return;
          }

          // Meta list can hold max 10 items per section, if more, slice it or use multiple sections.
          await bot.sendList(
            phone,
            "Selecciona un producto para agregarlo:",
            "Ver Productos",
            "Productos",
            products.slice(0, 10).map(p => ({
              id: `prod_${p.id}`,
              title: p.name,
              description: `$${p.basePrice} - ${p.description || ''}`
            }))
          );
          await updateSession("BROWSING_PRODUCT");
        } else {
          await bot.sendText(phone, "Por favor, utiliza el botón 'Ver Categorías' para elegir.");
        }
        break;

      case "BROWSING_PRODUCT":
        if (payloadId.startsWith("prod_")) {
          const productId = payloadId.replace("prod_", "");
          const product = await prisma.product.findUnique({ where: { id: productId } });
          if (!product) {
            await bot.sendText(phone, "Producto no encontrado. Escribe 'menu' para volver.");
            return;
          }
          await bot.sendText(phone, `Elegiste ${product.name} a $${product.basePrice}.\n\nPor favor escribe la CANTIDAD (en números, ej: 1, 2, 3)`);
          await updateSession("AWAITING_QUANTITY", { productId, productName: product.name, price: product.basePrice });
        } else {
          await bot.sendText(phone, "Por favor, utiliza el botón 'Ver Productos' para elegir.");
        }
        break;

      case "AWAITING_QUANTITY":
        const qty = parseInt(incomingText);
        if (isNaN(qty) || qty <= 0) {
          await bot.sendText(phone, "Cantidad inválida. Por favor escribe un número válido (ej: 1).");
          return;
        }
        
        cart.push({
          productId: tempData.productId,
          name: tempData.productName,
          quantity: qty,
          unitPrice: tempData.price,
          subtotal: tempData.price * qty
        });

        await updateSession("ASK_CONTINUE", {}, cart);

        await bot.sendButtons(
          phone,
          `¡Agregado al carrito! Tienes ${cart.length} items.\n¿Deseas pedir algo más?`,
          [
            { id: "continue_shopping", title: "Ver Menú" },
            { id: "checkout", title: "Ir a Pagar" }
          ]
        );
        break;

      case "ASK_CONTINUE":
        if (payloadId === "continue_shopping") {
           // Show categories again
           const cats = await prisma.category.findMany({ where: { isActive: true }, orderBy: { sequence: 'asc' } });
           await bot.sendList(
             phone,
             "Elige otra categoría:",
             "Ver Categorías",
             "Menú",
             cats.slice(0, 10).map(c => ({ id: `cat_${c.id}`, title: c.name }))
           );
           await updateSession("BROWSING_CATEGORY");
        } else if (payloadId === "checkout") {
          const total = cart.reduce((acc, item) => acc + item.subtotal, 0);
          
          let msj = "Tu pedido actual:\n";
          cart.forEach(c => {
             msj += `- ${c.quantity}x ${c.name} ($${c.subtotal})\n`;
          });
          msj += `\nTotal: $${total}\n\n¿Deseas Retirar por el local o Delivery?`;

          await bot.sendButtons(phone, msj, [
            { id: "method_pickup", title: "Retiro por Local" },
            { id: "method_delivery", title: "Delivery" }
          ]);
          await updateSession("AWAITING_DELIVERY_METHOD");
        }
        break;

      case "AWAITING_DELIVERY_METHOD":
        if (payloadId === "method_pickup") {
          await bot.sendButtons(
            phone,
            "Elegiste Retiro. ¿Cómo vas a pagar?",
            [
              { id: "pay_cash", title: "Efectivo" },
              { id: "pay_mp", title: "MercadoPago" }
            ]
          );
          await updateSession("AWAITING_PAYMENT_METHOD", { needsDelivery: false });
        } else if (payloadId === "method_delivery") {
          await bot.sendText(phone, "Elegiste Delivery. Por favor, escribe tu dirección de entrega:");
          await updateSession("AWAITING_ADDRESS", { needsDelivery: true });
        }
        break;

      case "AWAITING_ADDRESS":
        const address = incomingText.trim();
        if (address.length < 3) {
          await bot.sendText(phone, "La dirección parece muy corta. Por favor escríbela de nuevo:");
          return;
        }
        
        await bot.sendButtons(
          phone,
          `Dirección guardada: ${address}\n\n¿Cómo vas a pagar?`,
          [
            { id: "pay_cash", title: "Efectivo" },
            { id: "pay_mp", title: "MercadoPago" }
          ]
        );
        await updateSession("AWAITING_PAYMENT_METHOD", { ...tempData, address });
        break;

      case "AWAITING_PAYMENT_METHOD":
        if (payloadId !== "pay_cash" && payloadId !== "pay_mp") {
          await bot.sendText(phone, "Usa los botones para elegir un método de pago.");
          return;
        }

        const paymentMethod = payloadId === "pay_cash" ? "CASH" : "MERCADOPAGO";
        const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0) + (tempData.needsDelivery ? (config.deliveryCost || 0) : 0);

        // CREATE ORDER IN DB
        const order = await prisma.order.create({
          data: {
            clientName: "Cliente WhatsApp",
            clientPhone: phone,
            needsDelivery: tempData.needsDelivery,
            deliveryAddress: tempData.address,
            paymentMethod,
            total: totalAmount,
            status: "NEW",
            paymentStatus: "PENDING",
            items: {
              create: cart.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
                isHalfAndHalf: false
              }))
            },
            history: {
              create: { status: "NEW" }
            }
          }
        });

        await updateSession("FINISHED", {}, []);

        if (paymentMethod === "CASH") {
          await bot.sendText(phone, `¡Gracias por tu pedido!\nEl número de tu orden es: ${order.id.slice(-6).toUpperCase()}.\nEl total a pagar es $${totalAmount}.\nTe avisaremos cuando esté listo.`);
        } else {
          // If MercadoPago, try to generate link
          let mpInitPoint = "";
          if (config.mpAccessToken) {
            try {
              const { MercadoPagoConfig, Preference } = require("mercadopago");
              const client = new MercadoPagoConfig({ accessToken: config.mpAccessToken });
              const preference = new Preference(client);
              const result = await preference.create({
                body: {
                  items: [
                    { id: order.id, title: "Pedido Automático", quantity: 1, unit_price: Number(totalAmount) }
                  ],
                  external_reference: order.id
                }
              });
              if (result.init_point) {
                 mpInitPoint = result.init_point;
                 await prisma.order.update({ where: { id: order.id }, data: { mpPreferenceId: result.id } });
              }
            } catch (err) {}
          }
          
          if (mpInitPoint) {
            await bot.sendText(phone, `¡Gracias por tu pedido!\n\nPor favor, realiza el pago ingresando aquí:\n${mpInitPoint}\n\nTu número de orden es: ${order.id.slice(-6).toUpperCase()}.`);
          } else {
            await bot.sendText(phone, `¡Gracias por tu pedido!\nHubo un problema al generar el link de pago. Por favor indícanos por aquí cómo proceder. Tu orden es: ${order.id.slice(-6).toUpperCase()}.`);
          }
        }
        break;

      case "FINISHED":
        await bot.sendText(phone, "Tu pedido ya fue registrado. Si deseas hacer uno nuevo, escribe 'menu'.");
        break;

      default:
        await bot.sendText(phone, "Escribe 'hola' o 'menu' para comenzar.");
        break;
    }
  } catch (error) {
    console.error("Error procesando mensaje de bot:", error);
  }
}
