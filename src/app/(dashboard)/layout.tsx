"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { FincaProvider } from "@/lib/FincaContext";
import { usePathname } from "next/navigation";

const TITULOS: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/animales":      "Animales",
  "/potreros":      "Potreros y Rotación",
  "/cultivos":      "Cultivos",
  "/tareas":        "Tareas",
  "/peones":        "Peones",
  "/inventario":    "Inventario y Mantenimiento",
  "/calendario":    "Calendario de Tareas",
  "/croquis":       "Croquis de Finca",
  "/reportes":      "Reportes",
  "/configuracion": "Configuración",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const titulo = Object.entries(TITULOS).find(([k]) => pathname.startsWith(k))?.[1] ?? "FincaApp";

  return (
    <FincaProvider>
      <div className="flex h-screen bg-stone-50 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar onMenuClick={() => setSidebarOpen(true)} titulo={titulo} />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="p-4 lg:p-6 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </FincaProvider>
  );
}

