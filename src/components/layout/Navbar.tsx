"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Menu, Bell, ChevronDown, LogOut, User, Settings, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onMenuClick: () => void;
  titulo: string;
}

const TIPO_ICON: Record<string, string> = {
  TAREA:         "✅",
  VACUNA:        "💉",
  DESPARASITANTE:"🧪",
  ROTACION:      "🌿",
  PARTO:         "🐄",
  CELO:          "❤️",
  SUSCRIPCION:   "💳",
  SISTEMA:       "🔔",
};

const TIPO_COLOR: Record<string, string> = {
  TAREA:    "bg-yellow-50",
  VACUNA:   "bg-blue-50",
  ROTACION: "bg-amber-50",
  PARTO:    "bg-pink-50",
  SISTEMA:  "bg-stone-50",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "ahora mismo";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export function Navbar({ onMenuClick, titulo }: NavbarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user;
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  const [notifOpen, setNotifOpen]       = useState(false);
  const [notifs, setNotifs]             = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [marking, setMarking]           = useState(false);

  const noLeidas = notifs.filter(n => !n.leida).length;

  const loadNotifs = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/notificaciones");
      if (res.ok) setNotifs(await res.json());
    } catch {}
  }, [session?.user?.id]);

  // Cargar al montar y cada 60s
  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 60000);
    return () => clearInterval(interval);
  }, [loadNotifs]);

  // Al abrir, generar notificaciones automáticas y recargar
  const handleBellClick = async () => {
    const nextOpen = !notifOpen;
    setNotifOpen(nextOpen);
    if (nextOpen) {
      setLoadingNotifs(true);
      try {
        await fetch("/api/notificaciones/generar", { method: "POST" });
        await loadNotifs();
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const marcarTodas = async () => {
    setMarking(true);
    try {
      await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      // Reload from server to confirm
      await loadNotifs();
    } catch {}
    setMarking(false);
  };

  const marcarUna = async (n: any) => {
    // Mark as read
    if (!n.leida) {
      await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x));
    }
    // Navigate if there's an action
    if (n.accion) {
      setNotifOpen(false);
      router.push(n.accion);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-stone-100 flex items-center justify-between px-4 lg:px-5 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden text-stone-500" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-stone-800 leading-none">{titulo}</h1>
          <p className="text-[10px] text-stone-400 mt-0.5 leading-none">
            {new Date().toLocaleDateString("es-CR", { weekday: "short", day: "numeric", month: "short" })}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">

        {/* Bell */}
        <div className="relative">
          <Button
            variant="ghost" size="icon"
            className="text-stone-500 relative"
            onClick={handleBellClick}
          >
            <Bell className="w-4 h-4" />
            {noLeidas > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-0.5 leading-none">
                {noLeidas > 9 ? "9+" : noLeidas}
              </span>
            )}
          </Button>

          {notifOpen && (
            <>
              {/* Overlay para cerrar */}
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-2xl border border-stone-100 shadow-modal z-50 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-50">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-stone-800">Notificaciones</p>
                    {noLeidas > 0 && (
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {noLeidas} nuevas
                      </span>
                    )}
                  </div>
                  {noLeidas > 0 && (
                    <button
                      className="text-xs text-finca-green-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                      onClick={marcarTodas}
                      disabled={marking}
                    >
                      {marking ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                      Marcar leídas
                    </button>
                  )}
                </div>

                {/* Lista */}
                <div className="max-h-80 overflow-y-auto divide-y divide-stone-50">
                  {loadingNotifs ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-finca-green-500" />
                    </div>
                  ) : notifs.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                      <p className="text-xs text-stone-400">Sin notificaciones</p>
                    </div>
                  ) : notifs.slice(0, 10).map(n => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-stone-50 cursor-pointer transition-colors",
                        !n.leida && (TIPO_COLOR[n.tipo] ?? "bg-stone-50") + "/60"
                      )}
                      onClick={() => marcarUna(n)}
                    >
                      <span className="text-base leading-none mt-0.5 flex-shrink-0">
                        {TIPO_ICON[n.tipo] ?? "🔔"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs leading-snug", n.leida ? "text-stone-400" : "text-stone-700 font-medium")}>
                          {n.mensaje}
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.leida && (
                        <span className="w-2 h-2 bg-finca-green-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-stone-50">
                  <Link
                    href="/dashboard"
                    className="block text-center text-xs text-finca-green-600 hover:underline"
                    onClick={() => setNotifOpen(false)}
                  >
                    Ver dashboard →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-5 bg-stone-200" />

        {/* Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-9 rounded-xl">
              <Avatar className="w-6 h-6">
                <AvatarImage src={user?.image ?? ""} />
                <AvatarFallback className="bg-finca-green-600 text-white text-[10px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-stone-700 hidden sm:block max-w-28 truncate">
                {user?.name?.split(" ")[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl border-stone-100 shadow-modal p-1.5">
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-semibold text-stone-800 truncate">{user?.name}</p>
              <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-stone-100 my-1" />
            <DropdownMenuItem asChild className="rounded-xl text-xs cursor-pointer">
              <Link href="/configuracion"><User className="w-3.5 h-3.5 mr-2 text-stone-400" /> Mi perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl text-xs cursor-pointer">
              <Link href="/configuracion"><Settings className="w-3.5 h-3.5 mr-2 text-stone-400" /> Configuración</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-stone-100 my-1" />
            <DropdownMenuItem
              className="text-red-500 rounded-xl text-xs cursor-pointer focus:bg-red-50 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-3.5 h-3.5 mr-2" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
