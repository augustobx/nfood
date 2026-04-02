import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { cookies } from "next/headers";

const SALT = process.env.AUTH_SALT || "nfood-secret-salt-12345";
const SESSION_NAME = "nfood_client_session";

export function hashPassword(password: string): string {
  return crypto.createHmac("sha256", SALT).update(password).digest("hex");
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(clientId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.session.create({
    data: {
      clientId,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  cookieStore.delete(SESSION_NAME);
}

export async function getLoggedClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_NAME)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { client: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    cookieStore.delete(SESSION_NAME);
    return null;
  }

  // Optional: extend session expires if close to expiring

  return session.client;
}
