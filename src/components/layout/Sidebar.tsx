"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Beef, Grid3X3, Sprout, CheckSquare,
  Map, BarChart3, Settings, Leaf, X, Zap, Users, HardHat, Wrench, CalendarDays, Droplets, Scale, Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Principal",
    items: [
      { label: "Dashboard",  href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Gestión",
    items: [
      { label: "Animales",   href: "/animales",       icon: Beef },
      { label: "Lotes",      href: "/lotes",          icon: Users },
      { label: "Potreros",   href: "/potreros",       icon: Grid3X3 },
      { label: "Cultivos",   href: "/cultivos",       icon: Sprout },
      { label: "Leche",      href: "/leche",          icon: Droplets },
      { label: "Peso",       href: "/peso",           icon: Scale },
      { label: "Finanzas",   href: "/finanzas",       icon: Banknote },
      { label: "Tareas",     href: "/tareas",         icon: CheckSquare },
      { label: "Peones",     href: "/peones",         icon: HardHat },
      { label: "Inventario", href: "/inventario",     icon: Wrench  },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { label: "Croquis",     href: "/croquis",      icon: Map },
      { label: "Calendario",  href: "/calendario",   icon: CalendarDays },
      { label: "Reportes",    href: "/reportes",     icon: BarChart3 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Configuración", href: "/configuracion", icon: Settings },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full w-60 bg-white z-50 flex flex-col",
        "border-r border-stone-100",
        "transition-transform duration-300 ease-in-out",
        "lg:translate-x-0 lg:static lg:z-auto",
        open ? "translate-x-0 shadow-xl" : "-translate-x-full"
      )}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-100">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 bg-gradient-to-br from-finca-green-500 to-finca-green-700 rounded-xl flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-stone-900 text-sm leading-none">FincaApp</p>
              <p className="text-[10px] text-stone-400 leading-none mt-0.5">Costa Rica</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-4">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest px-2 mb-1">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium",
                        "transition-all duration-150 group relative",
                        active
                          ? "bg-finca-green-50 text-finca-green-700"
                          : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                      )}
                    >
                      {/* Active indicator */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-finca-green-600 rounded-r-full" />
                      )}
                      <item.icon className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors",
                        active ? "text-finca-green-600" : "text-stone-400 group-hover:text-stone-600"
                      )} />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Upgrade banner */}
        <div className="px-3 pb-4">
          <div className="bg-gradient-to-br from-finca-green-600 to-finca-green-800 rounded-2xl p-3.5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs font-semibold">Plan Gratuito</p>
            </div>
            <p className="text-[11px] text-green-100 leading-snug mb-2.5">
              Mejora al plan Pro y desbloquea reportes, notificaciones push y más.
            </p>
            <Link
              href="/configuracion#plan"
              className="block text-center text-[11px] font-semibold bg-white text-finca-green-700 rounded-xl py-1.5 hover:bg-green-50 transition-colors"
            >
              Mejorar plan →
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

