"use client";
import { LogOut } from "lucide-react";
import { logoutAdmin } from "@/app/actions/admin-auth";

export function LogoutButton() {
    const handleLogout = async () => {
        await logoutAdmin();
        window.location.reload();
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