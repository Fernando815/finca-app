"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, UserCheck, Phone, Pencil, Trash2,
  CalendarDays, Briefcase, DollarSign, UserX, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinca } from "@/lib/FincaContext";

const CARGO_LABELS: Record<string, string> = {
  PEON:      "Peón",
  ENCARGADO: "Encargado",
  VAQUERO:   "Vaquero",
  OPERADOR:  "Operador",
  OTRO:      "Otro",
};

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ACTIVO:     { label: "Activo",     color: "bg-green-100 text-green-700",  icon: UserCheck },
  INACTIVO:   { label: "Inactivo",   color: "bg-stone-100 text-stone-500",  icon: UserX },
  VACACIONES: { label: "Vacaciones", color: "bg-blue-100  text-blue-700",   icon: UserCheck },
  RETIRADO:   { label: "Retirado",   color: "bg-red-100   text-red-600",    icon: UserX },
};

function calcAntiguedad(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime();
  const dias  = Math.floor(diff / 86400000);
  if (dias < 30)  return `${dias}d`;
  if (dias < 365) return `${Math.floor(dias / 30)}m`;
  const años = Math.floor(dias / 365);
  const meses = Math.floor((dias % 365) / 30);
  return meses > 0 ? `${años}a ${meses}m` : `${años}a`;
}

const EMPTY: any = {
  nombre: "", cedula: "", cargo: "PEON", telefono: "",
  salario: "", fechaContratacion: new Date().toISOString().split("T")[0],
  estado: "ACTIVO", notas: "",
};

export default function PeonesPage() {
  const { toast } = useToast();
  const { fincaId } = useFinca();
  const [peones,  setPeones]    = useState<any[]>([]);
  const [search,  setSearch]    = useState("");
  const [filtro,  setFiltro]    = useState("TODOS");
  const [dialog,  setDialog]    = useState<"crear"|"editar"|null>(null);
  const [form,    setForm]      = useState<any>(EMPTY);
  const [saving,  setSaving]    = useState(false);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (!fincaId) return;
    fetch(`/api/peones?fincaId=${fincaId}`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setPeones(d);
    });
  }, [fincaId]);

  const reload = () => {
    if (!fincaId) return;
    fetch(`/api/peones?fincaId=${fincaId}`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setPeones(d);
    });
  };

  const openCrear = () => { setForm({ ...EMPTY, fechaContratacion: new Date().toISOString().split("T")[0] }); setDialog("crear"); };
  const openEditar = (p: any) => {
    setSelected(p);
    setForm({
      nombre: p.nombre, cedula: p.cedula ?? "", cargo: p.cargo,
      telefono: p.telefono ?? "", salario: p.salario ?? "",
      fechaContratacion: p.fechaContratacion?.split("T")[0] ?? new Date().toISOString().split("T")[0],
      estado: p.estado, notas: p.notas ?? "",
    });
    setDialog("editar");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = dialog === "editar";
      const url  = isEdit ? `/api/peones/${selected.id}` : "/api/peones";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fincaId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: isEdit ? "✅ Peón actualizado" : "✅ Peón registrado" });
      setDialog(null); reload();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return;
    const res = await fetch(`/api/peones/${id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Peón eliminado" }); reload(); }
    else toast({ title: "Error al eliminar", variant: "destructive" } as any);
  };

  const filtered = peones.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
                        (p.cedula ?? "").includes(search) ||
                        (p.telefono ?? "").includes(search);
    const matchFiltro = filtro === "TODOS" || p.estado === filtro;
    return matchSearch && matchFiltro;
  });

  const activos    = peones.filter(p => p.estado === "ACTIVO").length;
  const inactivos  = peones.filter(p => p.estado === "INACTIVO").length;
  const vacaciones = peones.filter(p => p.estado === "VACACIONES").length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Peones</h2>
          <p className="text-stone-500 text-sm">{peones.length} empleado(s) registrado(s)</p>
        </div>
        <Button onClick={openCrear} className="bg-finca-green-600 hover:bg-finca-green-700">
          <Plus className="w-4 h-4 mr-2" /> Registrar peón
        </Button>
      </div>

      {/* Conteos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Activos",    val: activos,    color: "bg-green-50 border-green-200 text-green-700" },
          { label: "Inactivos",  val: inactivos,  color: "bg-stone-50 border-stone-200 text-stone-600" },
          { label: "Vacaciones", val: vacaciones, color: "bg-blue-50  border-blue-200  text-blue-700"  },
        ].map(({ label, val, color }) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${color}`}>
            <p className="text-2xl font-bold">{val}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input placeholder="Buscar por nombre, cédula o teléfono..."
            className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los estados</SelectItem>
            {Object.entries(ESTADO_CONFIG).map(([v, c]) => (
              <SelectItem key={v} value={v}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-stone-300" />
          </div>
          <p className="text-stone-500 font-medium">No hay peones registrados</p>
          <p className="text-stone-400 text-sm mt-1">Registre el primer empleado de su finca</p>
          <Button onClick={openCrear} className="mt-4 bg-finca-green-600 hover:bg-finca-green-700">
            <Plus className="w-4 h-4 mr-2" /> Registrar peón
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const est = ESTADO_CONFIG[p.estado] ?? ESTADO_CONFIG.INACTIVO;
            return (
              <div key={p.id}
                className="bg-white rounded-2xl border border-stone-100 shadow-card hover:shadow-card-hover transition-all p-5 group relative"
              >
                {/* Acciones hover */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" className="h-7 w-7 p-0 shadow"
                    onClick={() => openEditar(p)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 w-7 p-0 shadow"
                    onClick={() => handleDelete(p.id, p.nombre)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-finca-green-100 flex items-center justify-center text-finca-green-700 font-bold text-lg flex-shrink-0">
                    {p.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="font-semibold text-stone-900 text-base leading-none">{p.nombre}</p>
                      <Badge className={cn("text-[10px] px-2 py-0.5 h-auto", est.color)}>
                        {est.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">{CARGO_LABELS[p.cargo] ?? p.cargo}</p>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                      {p.cedula && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500">
                          <Briefcase className="w-3 h-3 text-stone-400" />
                          <span className="font-mono">{p.cedula}</span>
                        </div>
                      )}
                      {p.telefono && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{p.telefono}</span>
                        </div>
                      )}
                      {p.salario && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500">
                          <DollarSign className="w-3 h-3 text-stone-400" />
                          <span>₡{Number(p.salario).toLocaleString()}/mes</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <CalendarDays className="w-3 h-3 text-stone-400" />
                        <span>Antigüedad: <span className="font-medium text-stone-700">{calcAntiguedad(p.fechaContratacion)}</span></span>
                      </div>
                    </div>

                    {p.notas && (
                      <p className="text-xs text-stone-400 mt-2 italic line-clamp-2">{p.notas}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      <Dialog open={!!dialog} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog === "editar" ? `✏️ Editar — ${selected?.nombre}` : "👷 Registrar nuevo peón"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nombre completo *</Label>
                <Input placeholder="Juan Pérez González" value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Cédula</Label>
                <Input placeholder="1-2345-6789" value={form.cedula}
                  onChange={e => setForm({ ...form, cedula: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input placeholder="8888-8888" value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select value={form.cargo} onValueChange={v => setForm({ ...form, cargo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CARGO_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESTADO_CONFIG).map(([v, c]) => (
                      <SelectItem key={v} value={v}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Salario mensual (₡)</Label>
                <Input type="number" min="0" step="1000" placeholder="500000"
                  value={form.salario} onChange={e => setForm({ ...form, salario: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de contratación</Label>
                <Input type="date" value={form.fechaContratacion}
                  onChange={e => setForm({ ...form, fechaContratacion: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea placeholder="Funciones, habilidades, observaciones..." rows={2}
                value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialog(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={saving}>
                {saving ? "Guardando..." : dialog === "editar" ? "Actualizar" : "Registrar peón"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
