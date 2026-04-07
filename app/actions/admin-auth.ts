"use server";
import { cookies } from "next/headers";

export async function loginAdmin(password: string) {
    // Busca la variable de entorno, si no existe usa la contraseña por defecto
    const correctPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (password === correctPassword) {
        const cookieStore = await cookies();
        cookieStore.set("admin_session", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7 // Guarda la sesión por 1 semana
        });
        return { success: true };
    }
    return { success: false, error: "Contraseña incorrecta" };
}

export async function logoutAdmin() {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    return { success: true };
}