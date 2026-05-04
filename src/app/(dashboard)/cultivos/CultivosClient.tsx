"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Leaf, Search, Filter, Sprout, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CultivoCard } from "@/components/cultivos/CultivoCard";
import { CultivoForm } from "@/components/cultivos/CultivoForm";
import { LaborForm } from "@/components/cultivos/LaborForm";
import { ParcelaForm } from "@/components/cultivos/ParcelaForm";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Tab = "cultivos" | "parcelas";
type Dialog = "cultivo" | "parcela" | "labor" | "editCultivo" | null;

export default function CultivosPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { toast } = useToast();

  const [tab, setTab]           = useState<Tab>("cultivos");
  const [cultivos, setCultivos] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [fincaId, setFincaId]   = useState<string>("");
  const [fincas, setFincas]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [dialog, setDialog]     = useState<Dialog>(searchParams.get("nuevo") === "1" ? "cultivo" : null);
  const [selected, setSelected] = useState<any>(null);// cultivo seleccionado para labor/edit
  const [search, setSearch]     = useState("");
  const [filterEtapa, setFilterEtapa] = useState("TODOS");

  // Load fincas first
  useEffect(() => {
    fetch("/api/fincas")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setFincas(data);
          setFincaId(data[0].id);
        }
      });
  }, []);

  const loadData = useCallback(() => {
    if (!fincaId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/cultivos?fincaId=${fincaId}`).then(r => r.json()),
      fetch(`/api/parcelas?fincaId=${fincaId}`).then(r => r.json()),
    ]).then(([c, p]) => {
      if (Array.isArray(c)) setCultivos(c);
      if (Array.isArray(p)) setParcelas(p);
    }).finally(() => setLoading(false));
  }, [fincaId]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Handlers ─────────────────────────────────── */
  async function handleNuevoCultivo(data: any) {
    setSaving(true);
    const res = await fetch("/api/cultivos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) {
      toast({ title: "✅ Cultivo registrado", description: "El cultivo fue agregado exitosamente." });
      setDialog(null);
      loadData();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error, variant: "destructive" });
    }
    setSaving(false);
  }

  async function handleEditarCultivo(data: any) {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/cultivos/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) {
      toast({ title: "✅ Cultivo actualizado" });
      setDialog(null);
      setSelected(null);
      loadData();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error, variant: "destructive" });
    }
    setSaving(false);
  }

  async function handleEliminarCultivo(id: string) {
    if (!confirm("¿Eliminar este cultivo? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/cultivos/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Cultivo eliminado" });
      loadData();
    }
  }

  async function handleNuevaParcela(data: any) {
    setSaving(true);
    const res = await fetch("/api/parcelas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, fincaId }) });
    if (res.ok) {
      toast({ title: "✅ Parcela creada" });
      setDialog(null);
      loadData();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error, variant: "destructive" });
    }
    setSaving(false);
  }

  async function handleNuevaLabor(data: any) {
    setSaving(true);
    const res = await fetch("/api/labores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) {
      toast({ title: "✅ Labor registrada", description: "La actividad fue guardada." });
      setDialog(null);
      setSelected(null);
      loadData();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error, variant: "destructive" });
    }
    setSaving(false);
  }

  /* ── Filtered cultivos ─────────────────────────── */
  const cultivosFiltrados = cultivos.filter(c => {
    const matchSearch = search === "" || c.tipo.toLowerCase().includes(search.toLowerCase()) || c.variedad?.toLowerCase().includes(search.toLowerCase()) || c.parcela?.nombre?.toLowerCase().includes(search.toLowerCase());
    const matchEtapa  = filterEtapa === "TODOS" || c.etapa === filterEtapa;
    return matchSearch && matchEtapa;
  });

  /* ── Stats ─────────────────────────────────────── */
  const totalHa   = cultivos.reduce((s, c) => s + (c.areaHectareas ?? 0), 0);
  const activos   = cultivos.filter(c => c.estado === "ACTIVO").length;
  const enCosecha = cultivos.filter(c => c.etapa === "COSECHA").length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Sprout className="w-6 h-6 text-finca-green-600" />
            Cultivos
          </h2>
          <p className="text-stone-500 text-sm mt-0.5">Gestión de cultivos y labores agrícolas</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialog("parcela")}
            className="gap-1.5"
          >
            <MapPin className="w-4 h-4" />
            Nueva parcela
          </Button>
          <Button
            size="sm"
            onClick={() => setDialog("cultivo")}
            className="bg-finca-green-600 hover:bg-finca-green-700 gap-1.5"
            disabled={parcelas.length === 0}
          >
            <Plus className="w-4 h-4" />
            Nuevo cultivo
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-finca-green-600">{cultivos.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Cultivos</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{totalHa.toFixed(1)}</p>
          <p className="text-xs text-stone-500 mt-0.5">Hectáreas</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{enCosecha}</p>
          <p className="text-xs text-stone-500 mt-0.5">En cosecha</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit">
        {([["cultivos", "🌱 Cultivos"], ["parcelas", "📍 Parcelas"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              tab === key
                ? "bg-white shadow-sm text-stone-900"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Cultivos ── */}
      {tab === "cultivos" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Buscar por tipo, variedad o parcela..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterEtapa} onValueChange={setFilterEtapa}>
              <SelectTrigger className="w-44">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas las etapas</SelectItem>
                {["PREPARACION","SIEMBRA","GERMINACION","CRECIMIENTO","FLORACION","FRUCTIFICACION","COSECHA","POST_COSECHA"].map(e => (
                  <SelectItem key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase().replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-finca-green-500" />
            </div>
          ) : cultivosFiltrados.length === 0 ? (
            <EmptyCultivos onNew={() => setDialog(parcelas.length === 0 ? "parcela" : "cultivo")} hasParcelas={parcelas.length > 0} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cultivosFiltrados.map(c => (
                <CultivoCard
                  key={c.id}
                  cultivo={c}
                  onEdit={(cv) => { setSelected(cv); setDialog("editCultivo"); }}
                  onDelete={handleEliminarCultivo}
                />
              ))}
              {/* Add labor button on each card is accessed via the card menu,
                  but also offer a standalone button when clicking a card */}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Parcelas ── */}
      {tab === "parcelas" && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-finca-green-500" />
            </div>
          ) : parcelas.length === 0 ? (
            <EmptyParcelas onNew={() => setDialog("parcela")} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {parcelas.map(p => (
                <ParcelaCard key={p.id} parcela={p} onNewCultivo={() => { setDialog("cultivo"); }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Dialogs ── */}
      {/* Nuevo Cultivo */}
      <Dialog open={dialog === "cultivo"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-finca-green-600" />
              Registrar nuevo cultivo
            </DialogTitle>
          </DialogHeader>
          <CultivoForm
            fincaId={fincaId}
            onSubmit={handleNuevoCultivo}
            loading={saving}
            onCancel={() => setDialog(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Editar Cultivo */}
      <Dialog open={dialog === "editCultivo"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-finca-green-600" />
              Editar cultivo
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <CultivoForm
              fincaId={fincaId}
              isEdit
              defaultValues={selected}
              onSubmit={handleEditarCultivo}
              loading={saving}
              onCancel={() => { setDialog(null); setSelected(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Nueva Parcela */}
      <Dialog open={dialog === "parcela"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-finca-green-600" />
              Crear nueva parcela
            </DialogTitle>
          </DialogHeader>
          <ParcelaForm
            fincaId={fincaId}
            onSubmit={handleNuevaParcela}
            loading={saving}
            onCancel={() => setDialog(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Nueva Labor */}
      <Dialog open={dialog === "labor"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-finca-green-600" />
              Registrar labor agrícola
              {selected && <span className="text-stone-400 font-normal text-sm">· {selected.tipo}</span>}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <LaborForm
              cultivoId={selected.id}
              onSubmit={handleNuevaLabor}
              loading={saving}
              onCancel={() => { setDialog(null); setSelected(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────── */
function EmptyCultivos({ onNew, hasParcelas }: { onNew: () => void; hasParcelas: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-stone-200 py-16 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 bg-finca-green-50 rounded-2xl flex items-center justify-center text-3xl">🌱</div>
      <div>
        <p className="font-semibold text-stone-700">
          {hasParcelas ? "No hay cultivos registrados" : "Primero cree una parcela"}
        </p>
        <p className="text-sm text-stone-400 mt-1 max-w-xs">
          {hasParcelas
            ? "Comience registrando su primer cultivo: café, plátano, yuca y más."
            : "Las parcelas son las áreas de su finca donde siembra. Créelas primero."}
        </p>
      </div>
      <Button onClick={onNew} className="bg-finca-green-600 hover:bg-finca-green-700 gap-2">
        <Plus className="w-4 h-4" />
        {hasParcelas ? "Registrar primer cultivo" : "Crear primera parcela"}
      </Button>
    </div>
  );
}

function EmptyParcelas({ onNew }: { onNew: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-stone-200 py-16 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 bg-finca-green-50 rounded-2xl flex items-center justify-center text-3xl">📍</div>
      <div>
        <p className="font-semibold text-stone-700">No hay parcelas registradas</p>
        <p className="text-sm text-stone-400 mt-1 max-w-xs">
          Las parcelas son las diferentes áreas o lotes de su finca destinados a cultivos.
        </p>
      </div>
      <Button onClick={onNew} className="bg-finca-green-600 hover:bg-finca-green-700 gap-2">
        <Plus className="w-4 h-4" /> Crear primera parcela
      </Button>
    </div>
  );
}

function ParcelaCard({ parcela, onNewCultivo }: { parcela: any; onNewCultivo: () => void }) {
  const TIPO_ICON: Record<string, string> = {
    CULTIVO: "🌱", PASTO: "🌾", BOSQUE: "🌳", INFRAESTRUCTURA: "🏚️", OTRO: "📍",
  };
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-4 hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-finca-green-50 rounded-xl flex items-center justify-center text-xl">
            {TIPO_ICON[parcela.tipo] ?? "📍"}
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm">{parcela.nombre}</p>
            {parcela.numero && <p className="text-[11px] text-stone-400">Parcela #{parcela.numero}</p>}
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {parcela.tipo.charAt(0) + parcela.tipo.slice(1).toLowerCase()}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-sm text-stone-500">
        {parcela.areaHectareas && (
          <span className="flex items-center gap-1 text-xs">
            <Leaf className="w-3 h-3" /> {parcela.areaHectareas} ha
          </span>
        )}
        <span className="text-xs text-finca-green-600 font-medium">
          {parcela._count?.cultivos ?? 0} cultivo(s)
        </span>
      </div>
      {parcela.notas && (
        <p className="text-[11px] text-stone-400 mt-2 line-clamp-2">{parcela.notas}</p>
      )}
    </div>
  );
}
