"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Wrench, Tractor, Zap, Hammer, Fuel, Droplets,
  Package, Pencil, Trash2, AlertTriangle, CalendarClock,
  ChevronRight, X, Loader2, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatFecha } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { useFinca } from "@/lib/FincaContext";

// ── Constants ────────────────────────────────────────────────
const CATEGORIAS = [
  { value: "MAQUINARIA",           label: "Maquinaria",            icon: Tractor  },
  { value: "HERRAMIENTA_ELECTRICA",label: "Herr. Eléctrica",       icon: Zap      },
  { value: "HERRAMIENTA_MANUAL",   label: "Herr. Manual",          icon: Hammer   },
  { value: "INSUMO",               label: "Insumos / Consumibles", icon: Fuel     },
  { value: "EQUIPO_RIEGO",         label: "Equipo de Riego",       icon: Droplets },
  { value: "OTRO",                 label: "Otro",                  icon: Package  },
];

const ESTADOS = ["BUENO","REGULAR","MALO","EN_REPARACION","DADO_DE_BAJA"];
const ESTADO_LABEL: Record<string, string> = {
  BUENO: "Bueno", REGULAR: "Regular", MALO: "Malo",
  EN_REPARACION: "En reparación", DADO_DE_BAJA: "Dado de baja",
};
const ESTADO_COLOR: Record<string, string> = {
  BUENO:         "bg-green-100 text-green-800",
  REGULAR:       "bg-yellow-100 text-yellow-800",
  MALO:          "bg-red-100 text-red-800",
  EN_REPARACION: "bg-orange-100 text-orange-800",
  DADO_DE_BAJA:  "bg-gray-100 text-gray-500",
};

const UNIDADES = ["unidad","litros","galones","kg","metros","rollos"];
const TIPOS_MANT = ["PREVENTIVO","CORRECTIVO","CAMBIO_ACEITE","REVISION","LIMPIEZA","REPARACION","OTRO"];
const TIPO_MANT_LABEL: Record<string, string> = {
  PREVENTIVO:"Preventivo", CORRECTIVO:"Correctivo", CAMBIO_ACEITE:"Cambio de aceite",
  REVISION:"Revisión", LIMPIEZA:"Limpieza", REPARACION:"Reparación", OTRO:"Otro",
};

// ── Types ─────────────────────────────────────────────────────
interface Item { id: string; nombre: string; codigo?: string; categoria: string; marca?: string; modelo?: string; estado: string; cantidad: number; unidad: string; cantidadMinima?: number; ultimoMantenimiento?: string; proximoMantenimiento?: string; costoAdquisicion?: number; notas?: string; mantenimientos?: Mant[]; }
interface Mant { id: string; tipo: string; descripcion: string; fecha: string; costo?: number; realizadoPor?: string; proximaFecha?: string; notas?: string; }

// ── Utils ─────────────────────────────────────────────────────
function CatIcon({ cat, className }: { cat: string; className?: string }) {
  const found = CATEGORIAS.find(c => c.value === cat);
  const Icon = found?.icon ?? Package;
  return <Icon className={className ?? "w-4 h-4"} />;
}
function diasHasta(fecha?: string | null) {
  if (!fecha) return null;
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000);
}
function stockBajo(item: Item) {
  return item.cantidadMinima != null && item.cantidad < item.cantidadMinima;
}

// ── Page ──────────────────────────────────────────────────────
export default function InventarioPage() {
  const { fincaId } = useFinca();
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [busqueda, setBusqueda] = useState("");
  const [modalItem, setModalItem] = useState<Item | null | "nuevo">(null);
  const [modalDetalle, setModalDetalle] = useState<Item | null>(null);
  const [modalMant, setModalMant] = useState<Item | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  // ── Queries ──
  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["inventario", fincaId],
    queryFn: () => fetch(`/api/inventario?fincaId=${fincaId}`).then(r => r.json()),
    enabled: !!fincaId,
  });

  // ── Filtered list ──
  const filtrados = items.filter(item => {
    if (filtroCategoria !== "TODAS" && item.categoria !== filtroCategoria) return false;
    if (busqueda && !`${item.nombre} ${item.marca ?? ""} ${item.modelo ?? ""}`.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  // ── Alertas ──
  const alertasStock   = items.filter(stockBajo);
  const alertasMant    = items.filter(i => { const d = diasHasta(i.proximoMantenimiento); return d !== null && d <= 7 && i.estado !== "DADO_DE_BAJA"; });

  // ── Helpers ──
  async function apiFetch(url: string, opts?: RequestInit) {
    const r = await fetch(url, opts);
    const text = await r.text();
    let json: any;
    try { json = JSON.parse(text); } catch { throw new Error(`Error ${r.status}: respuesta inválida del servidor`); }
    if (!r.ok) throw new Error(json?.error ?? `Error ${r.status}`);
    return json;
  }

  // ── Mutations ──
  const crearMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/api/inventario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, fincaId }),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventario"] }); setModalItem(null); toast({ title: "Item registrado" }); },
    onError: (e: any) => toast({ title: "Error al guardar", description: e.message, variant: "destructive" }),
  });
  const editarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiFetch(`/api/inventario/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventario"] }); setModalItem(null); toast({ title: "Item actualizado" }); },
    onError: (e: any) => toast({ title: "Error al actualizar", description: e.message, variant: "destructive" }),
  });
  const eliminarMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/inventario/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventario"] }); setModalDetalle(null); toast({ title: "Item eliminado" }); },
    onError: (e: any) => toast({ title: "Error al eliminar", description: e.message, variant: "destructive" }),
  });
  const mantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiFetch(`/api/inventario/${id}/mantenimiento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventario"] }); setModalMant(null); toast({ title: "Mantenimiento registrado" }); },
    onError: (e: any) => toast({ title: "Error al registrar", description: e.message, variant: "destructive" }),
  });

  const conteosPorCat = CATEGORIAS.map(c => ({ ...c, count: items.filter(i => i.categoria === c.value).length }));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventario y Mantenimiento</h2>
          <p className="text-gray-500 text-sm">{items.length} items registrados</p>
        </div>
        <Button
          onClick={() => setModalItem("nuevo")}
          className="bg-finca-green-600 hover:bg-finca-green-700"
          disabled={!fincaId}
        >
          <Plus className="w-4 h-4 mr-2" /> Agregar item
        </Button>
      </div>

      {/* Alertas */}
      {(alertasStock.length > 0 || alertasMant.length > 0) && (
        <div className="space-y-2">
          {alertasStock.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">
                <span className="font-semibold">{item.nombre}</span> — stock bajo: {item.cantidad} {item.unidad} (mínimo {item.cantidadMinima})
              </p>
            </div>
          ))}
          {alertasMant.map(item => {
            const d = diasHasta(item.proximoMantenimiento)!;
            return (
              <div key={item.id} className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <CalendarClock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <p className="text-sm text-orange-700 flex-1">
                  <span className="font-semibold">{item.nombre}</span> — mantenimiento {d <= 0 ? "vencido" : `en ${d} días`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Categorías filtro */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setFiltroCategoria("TODAS")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            filtroCategoria === "TODAS" ? "bg-finca-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Package className="w-3.5 h-3.5" /> Todos ({items.length})
        </button>
        {conteosPorCat.filter(c => c.count > 0).map(c => (
          <button
            key={c.value}
            onClick={() => setFiltroCategoria(prev => prev === c.value ? "TODAS" : c.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              filtroCategoria === c.value ? "bg-finca-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <c.icon className="w-3.5 h-3.5" /> {c.label} ({c.count})
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar por nombre, marca o modelo..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="max-w-sm"
      />

      {/* Lista */}
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Sin items en inventario"
          description="Registre herramientas, maquinaria e insumos para llevar el control."
          action={{ label: "Agregar item", onClick: () => setModalItem("nuevo") }}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtrados.map(item => {
            const bajo = stockBajo(item);
            const diasMant = diasHasta(item.proximoMantenimiento);
            const mantProximo = diasMant !== null && diasMant <= 7;
            return (
              <div
                key={item.id}
                onClick={() => setModalDetalle(item)}
                className={cn(
                  "bg-white rounded-2xl border shadow-sm p-4 cursor-pointer hover:shadow-md transition-all",
                  bajo ? "border-red-200" : mantProximo ? "border-orange-200" : "border-gray-100"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    bajo ? "bg-red-100 text-red-600" : "bg-finca-green-50 text-finca-green-700"
                  )}>
                    <CatIcon cat={item.categoria} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 truncate">{item.nombre}</p>
                      <Badge className={cn("text-xs flex-shrink-0", ESTADO_COLOR[item.estado])}>
                        {ESTADO_LABEL[item.estado]}
                      </Badge>
                    </div>
                    {(item.marca || item.modelo) && (
                      <p className="text-xs text-gray-500 mt-0.5">{[item.marca, item.modelo].filter(Boolean).join(" · ")}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span className={cn("font-medium", bajo ? "text-red-600" : "text-gray-700")}>
                        {item.cantidad} {item.unidad}
                        {bajo && " ⚠️ Stock bajo"}
                      </span>
                      {item.proximoMantenimiento && (
                        <span className={cn("flex items-center gap-1", mantProximo ? "text-orange-600 font-medium" : "")}>
                          <CalendarClock className="w-3 h-3" />
                          Mant. {diasMant! <= 0 ? "vencido" : `en ${diasMant}d`}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Nuevo / Editar ────────────────────────────── */}
      <Dialog open={!!modalItem} onOpenChange={o => { if (!o) setModalItem(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalItem === "nuevo" ? "Nuevo item" : "Editar item"}</DialogTitle>
          </DialogHeader>
          <ItemForm
            defaultValues={modalItem !== "nuevo" ? (modalItem as Item) : undefined}
            onSubmit={data => {
              if (modalItem === "nuevo") crearMutation.mutate(data);
              else editarMutation.mutate({ id: (modalItem as Item).id, data });
            }}
            loading={crearMutation.isPending || editarMutation.isPending}
            onCancel={() => setModalItem(null)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Modal Detalle ────────────────────────────────────── */}
      <Dialog open={!!modalDetalle} onOpenChange={o => { if (!o) setModalDetalle(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalDetalle && <CatIcon cat={modalDetalle.categoria} className="w-5 h-5 text-finca-green-600" />}
              {modalDetalle?.nombre}
            </DialogTitle>
          </DialogHeader>
          {modalDetalle && (
            <ItemDetalle
              item={modalDetalle}
              onEdit={() => { setModalDetalle(null); setModalItem(modalDetalle); }}
              onDelete={() => eliminarMutation.mutate(modalDetalle.id)}
              onMantenimiento={() => { setModalDetalle(null); setModalMant(modalDetalle); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal Mantenimiento ──────────────────────────────── */}
      <Dialog open={!!modalMant} onOpenChange={o => { if (!o) setModalMant(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar mantenimiento — {modalMant?.nombre}</DialogTitle>
          </DialogHeader>
          {modalMant && (
            <MantenimientoForm
              onSubmit={data => mantMutation.mutate({ id: modalMant.id, data })}
              loading={mantMutation.isPending}
              onCancel={() => setModalMant(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── ItemForm ──────────────────────────────────────────────────
function ItemForm({ defaultValues, onSubmit, loading, onCancel }: {
  defaultValues?: Partial<Item>;
  onSubmit: (data: any) => void;
  loading?: boolean;
  onCancel: () => void;
}) {
  const tieneMantenimiento = !!(defaultValues?.proximoMantenimiento || defaultValues?.ultimoMantenimiento);
  const [requiereMantenimiento, setRequiereMantenimiento] = useState(tieneMantenimiento);
  const [form, setForm] = useState({
    nombre: defaultValues?.nombre ?? "",
    codigo: defaultValues?.codigo ?? "",
    categoria: defaultValues?.categoria ?? "MAQUINARIA",
    marca: defaultValues?.marca ?? "",
    modelo: defaultValues?.modelo ?? "",
    estado: defaultValues?.estado ?? "BUENO",
    cantidad: defaultValues?.cantidad ?? 1,
    unidad: defaultValues?.unidad ?? "unidad",
    cantidadMinima: defaultValues?.cantidadMinima ?? "",
    costoAdquisicion: defaultValues?.costoAdquisicion ?? "",
    proximoMantenimiento: defaultValues?.proximoMantenimiento ? defaultValues.proximoMantenimiento.slice(0, 10) : "",
    notas: defaultValues?.notas ?? "",
  });
  const set = (k: string) => (e: any) => setForm(prev => ({ ...prev, [k]: e.target?.value ?? e }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: any = { ...form };
    if (!data.codigo) delete data.codigo;
    if (!data.marca) delete data.marca;
    if (!data.modelo) delete data.modelo;
    if (!data.cantidadMinima) delete data.cantidadMinima;
    else data.cantidadMinima = Number(data.cantidadMinima);
    if (!data.costoAdquisicion) delete data.costoAdquisicion;
    else data.costoAdquisicion = Number(data.costoAdquisicion);
    if (!requiereMantenimiento || !data.proximoMantenimiento) delete data.proximoMantenimiento;
    data.cantidad = Number(data.cantidad);
    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label>Nombre *</Label>
          <Input value={form.nombre} onChange={set("nombre")} placeholder="Ej: Tractor New Holland" required />
        </div>
        <div className="space-y-1">
          <Label>Código / Serie</Label>
          <Input value={form.codigo} onChange={set("codigo")} placeholder="Opcional" />
        </div>
        <div className="space-y-1">
          <Label>Categoría</Label>
          <Select value={form.categoria} onValueChange={v => setForm(p => ({ ...p, categoria: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Marca</Label>
          <Input value={form.marca} onChange={set("marca")} placeholder="Ej: Husqvarna" />
        </div>
        <div className="space-y-1">
          <Label>Modelo</Label>
          <Input value={form.modelo} onChange={set("modelo")} placeholder="Ej: 450e" />
        </div>
        <div className="space-y-1">
          <Label>Estado</Label>
          <Select value={form.estado} onValueChange={v => setForm(p => ({ ...p, estado: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ESTADOS.map(e => <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Cantidad</Label>
          <Input type="number" min={0} step="0.1" value={form.cantidad} onChange={set("cantidad")} />
        </div>
        <div className="space-y-1">
          <Label>Unidad</Label>
          <Select value={form.unidad} onValueChange={v => setForm(p => ({ ...p, unidad: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Stock mínimo (alerta)</Label>
          <Input type="number" min={0} step="0.1" value={form.cantidadMinima} onChange={set("cantidadMinima")} placeholder="Ej: 20" />
        </div>
        <div className="space-y-1">
          <Label>Costo adquisición (₡)</Label>
          <Input type="number" min={0} value={form.costoAdquisicion} onChange={set("costoAdquisicion")} placeholder="Opcional" />
        </div>

        {/* Checkbox mantenimiento */}
        <div className="col-span-2">
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <div
              onClick={() => setRequiereMantenimiento(v => { if (v) setForm(p => ({ ...p, proximoMantenimiento: "" })); return !v; })}
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                requiereMantenimiento ? "bg-finca-green-600 border-finca-green-600" : "border-gray-300 bg-white group-hover:border-finca-green-400"
              )}
            >
              {requiereMantenimiento && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">Este item requiere mantenimiento periódico</span>
          </label>
        </div>

        {/* Fecha solo visible si el check está activo */}
        {requiereMantenimiento && (
          <div className="col-span-2 space-y-1">
            <Label>Próximo mantenimiento</Label>
            <Input
              type="date"
              value={form.proximoMantenimiento}
              onChange={set("proximoMantenimiento")}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
        )}

        <div className="col-span-2 space-y-1">
          <Label>Notas</Label>
          <Textarea value={form.notas} onChange={set("notas")} rows={2} placeholder="Observaciones..." />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : defaultValues ? "Guardar cambios" : "Agregar item"}
        </Button>
      </div>
    </form>
  );
}

// ── ItemDetalle ───────────────────────────────────────────────
function ItemDetalle({ item, onEdit, onDelete, onMantenimiento }: {
  item: Item; onEdit: () => void; onDelete: () => void; onMantenimiento: () => void;
}) {
  const bajo = stockBajo(item);
  const diasMant = diasHasta(item.proximoMantenimiento);
  const catLabel = CATEGORIAS.find(c => c.value === item.categoria)?.label ?? item.categoria;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge className={cn("text-sm", ESTADO_COLOR[item.estado])}>{ESTADO_LABEL[item.estado]}</Badge>
        <span className="text-sm text-gray-500">{catLabel}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {item.marca && <InfoBox label="Marca" value={item.marca} />}
        {item.modelo && <InfoBox label="Modelo" value={item.modelo} />}
        {item.codigo && <InfoBox label="Código" value={item.codigo} />}
        <InfoBox
          label="Cantidad"
          value={`${item.cantidad} ${item.unidad}`}
          highlight={bajo ? "red" : undefined}
        />
        {item.cantidadMinima != null && (
          <InfoBox label="Stock mínimo" value={`${item.cantidadMinima} ${item.unidad}`} />
        )}
        {item.costoAdquisicion != null && (
          <InfoBox label="Costo adquisición" value={`₡${item.costoAdquisicion.toLocaleString()}`} />
        )}
        {item.ultimoMantenimiento && (
          <InfoBox label="Último mantenimiento" value={formatFecha(item.ultimoMantenimiento)} />
        )}
        {item.proximoMantenimiento && (
          <InfoBox
            label="Próximo mantenimiento"
            value={diasMant !== null && diasMant <= 0 ? "¡Vencido!" : diasMant !== null && diasMant <= 7 ? `En ${diasMant} días` : formatFecha(item.proximoMantenimiento)}
            highlight={diasMant !== null && diasMant <= 7 ? "orange" : undefined}
          />
        )}
      </div>

      {item.notas && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Notas</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.notas}</p>
        </div>
      )}

      {/* Último mantenimiento */}
      {item.mantenimientos && item.mantenimientos.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs font-medium text-blue-600 mb-1 flex items-center gap-1">
            <ClipboardList className="w-3 h-3" /> Último registro de mantenimiento
          </p>
          <p className="text-sm font-medium text-blue-800">{item.mantenimientos[0].descripcion}</p>
          <p className="text-xs text-blue-600 mt-0.5">{TIPO_MANT_LABEL[item.mantenimientos[0].tipo]} · {formatFecha(item.mantenimientos[0].fecha)}</p>
          {item.mantenimientos[0].realizadoPor && (
            <p className="text-xs text-blue-500 mt-0.5">Por: {item.mantenimientos[0].realizadoPor}</p>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1 flex-wrap">
        <Button variant="outline" size="sm" onClick={onMantenimiento} className="flex-1">
          <Wrench className="w-4 h-4 mr-1.5" /> Registrar mantenimiento
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="w-4 h-4 mr-1.5" /> Editar
        </Button>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function InfoBox({ label, value, highlight }: { label: string; value: string; highlight?: "red"|"orange" }) {
  return (
    <div className={cn("rounded-xl p-3", highlight === "red" ? "bg-red-50" : highlight === "orange" ? "bg-orange-50" : "bg-gray-50")}>
      <p className={cn("text-xs font-medium mb-0.5", highlight === "red" ? "text-red-500" : highlight === "orange" ? "text-orange-500" : "text-gray-500")}>{label}</p>
      <p className={cn("text-sm font-semibold", highlight === "red" ? "text-red-700" : highlight === "orange" ? "text-orange-700" : "text-gray-800")}>{value}</p>
    </div>
  );
}

// ── MantenimientoForm ─────────────────────────────────────────
function MantenimientoForm({ onSubmit, loading, onCancel }: {
  onSubmit: (data: any) => void; loading?: boolean; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    tipo: "PREVENTIVO",
    descripcion: "",
    fecha: new Date().toISOString().slice(0, 10),
    costo: "",
    realizadoPor: "",
    proximaFecha: "",
    notas: "",
  });
  const set = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target?.value ?? e }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: any = { ...form };
    if (!data.costo) delete data.costo; else data.costo = Number(data.costo);
    if (!data.realizadoPor) delete data.realizadoPor;
    if (!data.proximaFecha) delete data.proximaFecha;
    if (!data.notas) delete data.notas;
    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Tipo de mantenimiento</Label>
        <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIPOS_MANT.map(t => <SelectItem key={t} value={t}>{TIPO_MANT_LABEL[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Descripción *</Label>
        <Textarea value={form.descripcion} onChange={set("descripcion")} required rows={2} placeholder="¿Qué se hizo?" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Fecha</Label>
          <Input type="date" value={form.fecha} onChange={set("fecha")} />
        </div>
        <div className="space-y-1">
          <Label>Costo (₡)</Label>
          <Input type="number" min={0} value={form.costo} onChange={set("costo")} placeholder="Opcional" />
        </div>
        <div className="space-y-1">
          <Label>Realizado por</Label>
          <Input value={form.realizadoPor} onChange={set("realizadoPor")} placeholder="Nombre o taller" />
        </div>
        <div className="space-y-1">
          <Label>Próximo mantenimiento</Label>
          <Input type="date" value={form.proximaFecha} onChange={set("proximaFecha")} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notas adicionales</Label>
        <Textarea value={form.notas} onChange={set("notas")} rows={2} placeholder="Observaciones..." />
      </div>
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar mantenimiento"}
        </Button>
      </div>
    </form>
  );
}
