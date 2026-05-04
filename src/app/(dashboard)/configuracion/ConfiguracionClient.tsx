"use client";
import { useState } from "react";
import { User, Building2, Shield, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Tab = "perfil" | "finca" | "seguridad";

const ENFOQUES = [
  { value: "LECHE",       label: "🥛 Leche" },
  { value: "CRIA",        label: "🐮 Cría" },
  { value: "ENGORDE",     label: "🐂 Engorde" },
  { value: "AGRICULTURA", label: "🌱 Agricultura" },
  { value: "MIXTA",       label: "🌿 Mixta" },
];

export default function ConfiguracionClient({ user, fincas }: { user: any; fincas: any[] }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("perfil");
  const [saving, setSaving] = useState(false);
  const [selectedFinca, setSelectedFinca] = useState<any>(fincas[0] ?? null);

  // Perfil form state
  const [nombre, setNombre] = useState(user?.name ?? "");
  const [telefono, setTelefono] = useState(user?.phone ?? "");

  // Finca form state
  const [fincaNombre, setFincaNombre] = useState(selectedFinca?.nombre ?? "");
  const [fincaUbicacion, setFincaUbicacion] = useState(selectedFinca?.ubicacion ?? "");
  const [fincaArea, setFincaArea] = useState(selectedFinca?.areaTotal?.toString() ?? "");
  const [fincaEnfoque, setFincaEnfoque] = useState(selectedFinca?.enfoque ?? "MIXTA");
  const [fincaDescripcion, setFincaDescripcion] = useState(selectedFinca?.descripcion ?? "");

  // Seguridad form state
  const [pwActual, setPwActual] = useState("");
  const [pwNueva, setPwNueva] = useState("");
  const [pwConfirmar, setPwConfirmar] = useState("");

  async function savePerfil() {
    setSaving(true);
    const res = await fetch("/api/auth/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nombre, phone: telefono }),
    });
    if (res.ok) toast({ title: "✅ Perfil actualizado" });
    else toast({ title: "Error al guardar", variant: "destructive" });
    setSaving(false);
  }

  async function saveFinca() {
    if (!selectedFinca) return;
    setSaving(true);
    const res = await fetch(`/api/fincas/${selectedFinca.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: fincaNombre, ubicacion: fincaUbicacion,
        areaTotal: fincaArea ? parseFloat(fincaArea) : null,
        enfoque: fincaEnfoque, descripcion: fincaDescripcion,
      }),
    });
    if (res.ok) toast({ title: "✅ Finca actualizada" });
    else toast({ title: "Error al guardar", variant: "destructive" });
    setSaving(false);
  }

  async function savePassword() {
    if (pwNueva !== pwConfirmar) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" }); return;
    }
    if (pwNueva.length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" }); return;
    }
    setSaving(true);
    const res = await fetch("/api/auth/cambiar-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual: pwActual, nueva: pwNueva }),
    });
    if (res.ok) {
      toast({ title: "✅ Contraseña actualizada" });
      setPwActual(""); setPwNueva(""); setPwConfirmar("");
    } else {
      const e = await res.json();
      toast({ title: "Error", description: e.error, variant: "destructive" });
    }
    setSaving(false);
  }

  const TABS = [
    { id: "perfil",    label: "Mi perfil",  icon: User },
    { id: "finca",     label: "Mi finca",   icon: Building2 },
    { id: "seguridad", label: "Seguridad",  icon: Shield },
  ] as const;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-stone-900">Configuración</h2>
        <p className="text-stone-500 text-sm mt-0.5">Administre su perfil, finca y seguridad</p>
      </div>

      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              tab === id ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700")}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── Perfil ── */}
      {tab === "perfil" && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6 space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-stone-50">
            <div className="w-14 h-14 bg-finca-green-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-finca-green-700">
              {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-stone-900">{user?.name ?? "Sin nombre"}</p>
              <p className="text-sm text-stone-400">{user?.email}</p>
              <Badge variant="secondary" className="mt-1 text-[10px]">
                {user?.role === "ADMIN" ? "👑 Administrador" : "🌾 Productor"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Su nombre..." />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Ej: 8888-8888" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Correo electrónico</Label>
              <Input value={user?.email ?? ""} disabled className="bg-stone-50 text-stone-400" />
              <p className="text-[11px] text-stone-400">El correo no puede modificarse.</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={savePerfil} className="bg-finca-green-600 hover:bg-finca-green-700" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1.5" /> Guardar perfil</>}
            </Button>
          </div>
        </div>
      )}

      {/* ── Finca ── */}
      {tab === "finca" && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6 space-y-5">
          {fincas.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-stone-500">No tiene fincas registradas aún.</p>
            </div>
          ) : (
            <>
              {fincas.length > 1 && (
                <div className="space-y-2">
                  <Label>Seleccionar finca</Label>
                  <Select value={selectedFinca?.id} onValueChange={(id) => {
                    const f = fincas.find(f => f.id === id);
                    if (f) {
                      setSelectedFinca(f);
                      setFincaNombre(f.nombre);
                      setFincaUbicacion(f.ubicacion ?? "");
                      setFincaArea(f.areaTotal?.toString() ?? "");
                      setFincaEnfoque(f.enfoque ?? "MIXTA");
                      setFincaDescripcion(f.descripcion ?? "");
                    }
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedFinca && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre de la finca *</Label>
                      <Input value={fincaNombre} onChange={e => setFincaNombre(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Ubicación</Label>
                      <Input value={fincaUbicacion} onChange={e => setFincaUbicacion(e.target.value)} placeholder="Provincia, cantón..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Área total (ha)</Label>
                      <Input type="number" step="0.1" value={fincaArea} onChange={e => setFincaArea(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Enfoque productivo</Label>
                      <Select value={fincaEnfoque} onValueChange={setFincaEnfoque}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ENFOQUES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Descripción</Label>
                      <Textarea value={fincaDescripcion} onChange={e => setFincaDescripcion(e.target.value)} rows={2} placeholder="Descripción de la finca..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3 bg-stone-50 rounded-xl text-center">
                    <div><p className="text-lg font-bold text-stone-800">{selectedFinca._count?.animales ?? 0}</p><p className="text-[10px] text-stone-400">Animales</p></div>
                    <div><p className="text-lg font-bold text-stone-800">{selectedFinca._count?.potreros ?? 0}</p><p className="text-[10px] text-stone-400">Potreros</p></div>
                    <div><p className="text-lg font-bold text-stone-800">{selectedFinca._count?.parcelas ?? 0}</p><p className="text-[10px] text-stone-400">Parcelas</p></div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={saveFinca} className="bg-finca-green-600 hover:bg-finca-green-700" disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1.5" /> Guardar finca</>}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Seguridad ── */}
      {tab === "seguridad" && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6 space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contraseña actual</Label>
              <Input type="password" value={pwActual} onChange={e => setPwActual(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <Input type="password" value={pwNueva} onChange={e => setPwNueva(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-2">
              <Label>Confirmar nueva contraseña</Label>
              <Input type="password" value={pwConfirmar} onChange={e => setPwConfirmar(e.target.value)} placeholder="Repita la contraseña" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={savePassword} className="bg-finca-green-600 hover:bg-finca-green-700" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Shield className="w-4 h-4 mr-1.5" /> Cambiar contraseña</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
