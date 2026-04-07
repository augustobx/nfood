"use client";
import { useEffect } from "react";
import { LogOut } from "lucide-react";
import { logoutAdmin } from "@/app/actions/admin-auth";
import { useRouter } from "next/navigation";

export function LogoutButton() {
    const router = useRouter();

    // Limpieza agresiva: apenas carga el Admin, destrabamos la pantalla
    useEffect(() => {
        document.body.style.pointerEvents = "auto";
        document.body.removeAttribute("data-scroll-locked");
    }, []);

    const handleLogout = async () => {
        await logoutAdmin();
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 hover:bg-red-900/30 hover:text-red-400 w-full text-left transition-all mt-auto"
        >
            <LogOut className="h-5 w-5" /> Cerrar Sesión
        </button>
    );
}