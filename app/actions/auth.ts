"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, createSession, clearSession, getLoggedClient } from "@/lib/auth";

export async function registerClient(formData: FormData) {
  try {
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string | null;

    if (!phone || !password) {
      return { success: false, error: "Teléfono y contraseña son obligatorios." };
    }

    const existing = await prisma.client.findUnique({
      where: { phone },
    });

    if (existing) {
      return { success: false, error: "El teléfono ya está registrado. Ingresá en lugar de registrarte." };
    }

    const client = await prisma.client.create({
      data: {
        phone,
        password: hashPassword(password),
        name: name || undefined,
      },
    });

    await createSession(client.id);

    return { success: true };
  } catch (error: any) {
    console.error("Auth register error:", error);
    return { success: false, error: "Hubo un error al registrarse." };
  }
}

export async function loginClient(formData: FormData) {
  try {
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    if (!phone || !password) {
      return { success: false, error: "Tenés que ingresar tu teléfono y clave." };
    }

    const client = await prisma.client.findUnique({
      where: { phone },
    });

    if (!client || client.password !== hashPassword(password)) {
      return { success: false, error: "Credenciales incorrectas." };
    }

    await createSession(client.id);

    return { success: true };
  } catch (error: any) {
    console.error("Auth login error:", error);
    return { success: false, error: "Error interno del servidor." };
  }
}

export async function logoutClient() {
  await clearSession();
  return { success: true };
}

export async function fetchCurrentClient() {
  const client = await getLoggedClient();
  if (!client) return null;
  // Omit password from return
  const { password, ...safeClient } = client;
  return safeClient;
}
