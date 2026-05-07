"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Shield, Crown, MoreVertical, CalendarPlus, Trash2, Eye, KeyRound, Copy, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface User {
  id: string; name: string; email: string; role: string; createdAt: string;
  suscripcion: { estado: string; plan: string; fechaVencimiento: string | null } | null;
  _count: { fincas: number };
}

export function AdminUsersTable({ users: initial, currentUserId }: { users: User[]; currentUserId: string }) {
  const [users, setUsers] = useState<User[]>(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [diasDialog, setDiasDialog] = useState<User | null>(null);
  const [dias, setDias] = useState("30");
  const [pwDialog, setPwDialog] = useState<{ user: User; pw: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function patch(userId: string, body: object) {
    setLoading(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    });
    setLoading(null);
    if (!res.ok) { alert((await res.json()).error); return null; }
    return res.json();
  }

  async function toggleRole(u: User) {
    const newRole = u.role === "ADMIN" ? "PRODUCTOR" : "ADMIN";
    if (!confirm(`¿Cambiar rol de ${u.name} a ${newRole}?`)) return;
    const ok = await patch(u.id, { role: newRole });
    if (ok) setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
  }

  async function cambiarEstadoSus(u: User, estado: string) {
    const ok = await patch(u.id, { suscripcionEstado: estado });
    if (ok) setUsers(prev => prev.map(x => x.id === u.id ? {
      ...x, suscripcion: x.suscripcion ? { ...x.suscripcion, estado } : { estado, plan: "BASICO", fechaVencimiento: null }
    } : x));
  }

  async function extenderDias(u: User) {
    const d = parseInt(dias);
    if (isNaN(d) || d <= 0) return;
    const ok = await patch(u.id, { diasExtra: d });
    if (ok) { setDiasDialog(null); alert(`✅ ${d} días agregados a ${u.name}`); }
  }

  async function resetPassword(u: User) {
    if (!confirm(`¿Resetear la contraseña de ${u.name ?? u.email}?`)) return;
    const data = await patch(u.id, { resetPassword: true });
    if (data?.nuevaPassword) setPwDialog({ user: u, pw: data.nuevaPassword });
  }

  function copiar(pw: string) {
    navigator.clipboard.writeText(pw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function eliminar(u: User) {
    if (!confirm(`⚠️ ¿Eliminar al usuario ${u.name}? Esta acción no se puede deshacer.`)) return;
    setLoading(u.id);
    const res = await fetch(`/api/admin/users?userId=${u.id}`, { method: "DELETE" });
    setLoading(null);
    if (res.ok) setUsers(prev => prev.filter(x => x.id !== u.id));
    else alert((await res.json()).error);
  }

  const estadoColor: Record<string, string> = {
    ACTIVA:   "bg-green-100 text-green-700",
    PRUEBA:   "bg-blue-100 text-blue-700",
    VENCIDA:  "bg-red-100 text-red-700",
    CANCELADA:"bg-stone-100 text-stone-500",
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-50 flex items-center justify-between">
          <h3 className="font-semibold text-stone-800">Usuarios ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Suscripción</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Fincas</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Registro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800 text-xs">{u.name ?? "Sin nombre"}</p>
                    <p className="text-[11px] text-stone-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] ${u.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-stone-100 text-stone-600"}`}>
                      {u.role === "ADMIN" ? "👑 Admin" : "🌾 Productor"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.suscripcion ? (
                      <div>
                        <Badge className={`text-[10px] ${estadoColor[u.suscripcion.estado] ?? "bg-stone-100 text-stone-500"}`}>
                          {u.suscripcion.estado}
                        </Badge>
                        {u.suscripcion.fechaVencimiento && (
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Vence: {format(new Date(u.suscripcion.fechaVencimiento), "d MMM yy", { locale: es })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-stone-400">Sin suscripción</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-stone-700 font-medium text-xs">{u._count.fincas}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-stone-400">
                      {format(new Date(u.createdAt), "d MMM yy", { locale: es })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== currentUserId && (
                      <div className="flex items-center gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-7 w-7" title="Ver fincas y datos">
                          <Link href={`/admin/usuarios/${u.id}`}>
                            <Eye className="w-4 h-4 text-stone-400" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={loading === u.id}>
                            <MoreVertical className="w-4 h-4 text-stone-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5">
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer" onClick={() => toggleRole(u)}>
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            {u.role === "ADMIN" ? "Quitar admin" : "Hacer admin"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer" onClick={() => cambiarEstadoSus(u, "ACTIVA")}>
                            <Shield className="w-3.5 h-3.5 text-green-600" /> Activar suscripción
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer" onClick={() => cambiarEstadoSus(u, "PRUEBA")}>
                            <Shield className="w-3.5 h-3.5 text-blue-500" /> Poner en prueba
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer" onClick={() => cambiarEstadoSus(u, "VENCIDA")}>
                            <Shield className="w-3.5 h-3.5 text-red-500" /> Marcar vencida
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer" onClick={() => { setDiasDialog(u); setDias("30"); }}>
                            <CalendarPlus className="w-3.5 h-3.5 text-purple-500" /> Extender días
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer text-amber-600 focus:bg-amber-50" onClick={() => resetPassword(u)}>
                            <KeyRound className="w-3.5 h-3.5" /> Resetear contraseña
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer text-red-600 focus:bg-red-50" onClick={() => eliminar(u)}>
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar usuario
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog extender días */}
      <Dialog open={!!diasDialog} onOpenChange={o => { if (!o) setDiasDialog(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>📅 Extender suscripción</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500">{diasDialog?.name}</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Días a agregar</label>
              <Input type="number" min="1" max="365" value={dias} onChange={e => setDias(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDiasDialog(null)}>Cancelar</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => diasDialog && extenderDias(diasDialog)}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog contraseña reseteada */}
      <Dialog open={!!pwDialog} onOpenChange={o => { if (!o) { setPwDialog(null); setCopied(false); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>🔑 Contraseña temporal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500">
            Dale esta contraseña a <strong>{pwDialog?.user.name ?? pwDialog?.user.email}</strong>. 
            Podrá cambiarla desde Configuración &gt; Seguridad.
          </p>
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
            <code className="flex-1 font-mono text-lg font-bold text-stone-800 tracking-widest">
              {pwDialog?.pw}
            </code>
            <Button variant="ghost" size="icon" onClick={() => pwDialog && copiar(pwDialog.pw)} className="h-8 w-8 shrink-0">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-stone-400" />}
            </Button>
          </div>
          <p className="text-[11px] text-stone-400 text-center">
            ⚠️ Esta contraseña solo se muestra una vez
          </p>
          <Button className="w-full" onClick={() => { setPwDialog(null); setCopied(false); }}>
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Shield, Crown, MoreVertical, CalendarPlus, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface User {
  id: string; name: string; email: string; role: string; createdAt: string;
  suscripcion: { estado: string; plan: string; fechaVencimiento: string | null } | null;
  _count: { fincas: number };
}

export function AdminUsersTable({ users: initial, currentUserId }: { users: User[]; currentUserId: string }) {
  const [users, setUsers] = useState<User[]>(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [diasDialog, setDiasDialog] = useState<User | null>(null);
  const [dias, setDias] = useState("30");

  async function patch(userId: string, body: object) {
    setLoading(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    });
    setLoading(null);
    if (!res.ok) { alert((await res.json()).error); return false; }
    return true;
  }

  async function toggleRole(u: User) {
    const newRole = u.role === "ADMIN" ? "PRODUCTOR" : "ADMIN";
    if (!confirm(`¿Cambiar rol de ${u.name} a ${newRole}?`)) return;
    const ok = await patch(u.id, { role: newRole });
    if (ok) setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
  }

  async function cambiarEstadoSus(u: User, estado: string) {
    const ok = await patch(u.id, { suscripcionEstado: estado });
    if (ok) setUsers(prev => prev.map(x => x.id === u.id ? {
      ...x, suscripcion: x.suscripcion ? { ...x.suscripcion, estado } : { estado, plan: "BASICO", fechaVencimiento: null }
    } : x));
  }

  async function extenderDias(u: User) {
    const d = parseInt(dias);
    if (isNaN(d) || d <= 0) return;
    const ok = await patch(u.id, { diasExtra: d });
    if (ok) { setDiasDialog(null); alert(`✅ ${d} días agregados a ${u.name}`); }
  }

  async function eliminar(u: User) {
    if (!confirm(`⚠️ ¿Eliminar al usuario ${u.name}? Esta acción no se puede deshacer.`)) return;
    setLoading(u.id);
    const res = await fetch(`/api/admin/users?userId=${u.id}`, { method: "DELETE" });
    setLoading(null);
    if (res.ok) setUsers(prev => prev.filter(x => x.id !== u.id));
    else alert((await res.json()).error);
  }

  const estadoColor: Record<string, string> = {
    ACTIVA:   "bg-green-100 text-green-700",
    PRUEBA:   "bg-blue-100 text-blue-700",
    VENCIDA:  "bg-red-100 text-red-700",
    CANCELADA:"bg-stone-100 text-stone-500",
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-50 flex items-center justify-between">
          <h3 className="font-semibold text-stone-800">Usuarios ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Suscripción</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Fincas</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Registro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800 text-xs">{u.name ?? "Sin nombre"}</p>
                    <p className="text-[11px] text-stone-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] ${u.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-stone-100 text-stone-600"}`}>
                      {u.role === "ADMIN" ? "👑 Admin" : "🌾 Productor"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.suscripcion ? (
                      <div>
                        <Badge className={`text-[10px] ${estadoColor[u.suscripcion.estado] ?? "bg-stone-100 text-stone-500"}`}>
                          {u.suscripcion.estado}
                        </Badge>
                        {u.suscripcion.fechaVencimiento && (
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Vence: {format(new Date(u.suscripcion.fechaVencimiento), "d MMM yy", { locale: es })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-stone-400">Sin suscripción</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-stone-700 font-medium text-xs">{u._count.fincas}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-stone-400">
                      {format(new Date(u.createdAt), "d MMM yy", { locale: es })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== currentUserId && (
                      <div className="flex items-center gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-7 w-7" title="Ver fincas y datos">
                          <Link href={`/admin/usuarios/${u.id}`}>
                            <Eye className="w-4 h-4 text-stone-400" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={loading === u.id}>
                            <MoreVertical className="w-4 h-4 text-stone-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5">
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer" onClick={() => toggleRole(u)}>
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            {u.role === "ADMIN" ? "Quitar admin" : "Hacer admin"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer" onClick={() => cambiarEstadoSus(u, "ACTIVA")}>
                            <Shield className="w-3.5 h-3.5 text-green-600" /> Activar suscripción
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer" onClick={() => cambiarEstadoSus(u, "PRUEBA")}>
                            <Shield className="w-3.5 h-3.5 text-blue-500" /> Poner en prueba
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer" onClick={() => cambiarEstadoSus(u, "VENCIDA")}>
                            <Shield className="w-3.5 h-3.5 text-red-500" /> Marcar vencida
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer" onClick={() => { setDiasDialog(u); setDias("30"); }}>
                            <CalendarPlus className="w-3.5 h-3.5 text-purple-500" /> Extender días
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem className="rounded-xl text-xs gap-2 cursor-pointer text-red-600 focus:bg-red-50" onClick={() => eliminar(u)}>
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar usuario
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog extender días */}
      <Dialog open={!!diasDialog} onOpenChange={o => { if (!o) setDiasDialog(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>📅 Extender suscripción</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500">{diasDialog?.name}</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Días a agregar</label>
              <Input type="number" min="1" max="365" value={dias} onChange={e => setDias(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDiasDialog(null)}>Cancelar</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => diasDialog && extenderDias(diasDialog)}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
