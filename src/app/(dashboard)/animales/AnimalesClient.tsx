"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Beef, Pencil, Trash2, Download, Upload, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimalCard } from "@/components/animales/AnimalCard";
import { AnimalForm } from "@/components/animales/AnimalForm";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useFinca } from "@/lib/FincaContext";

type ImportResult = { creados: number; errores: { fila: number; codigo: string; error: string }[]; omitidos: number; total: number } | null;

export default function AnimalesPage() {
  const searchParams = useSearchParams();
  const [dialog, setDialog] = useState<"crear" | "editar" | "importar" | null>(
    searchParams.get("nuevo") === "1" ? "crear" : null
  );
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [filtroLote, setFiltroLote] = useState("TODOS");
  const { fincaId } = useFinca();
  const [lotes, setLotes] = useState<any[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    if (!fincaId) {
      setLotes([]);
      setFiltroLote("TODOS");
      return;
    }
    setFiltroLote("TODOS");
    fetch(`/api/lotes?fincaId=${fincaId}`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setLotes(d);
    });
  }, [fincaId]);

  const { data: animales = [], isLoading } = useQuery({
    queryKey: ["animales", fincaId, filtroEstado, filtroLote, search],
    queryFn: async () => {
      const params = new URLSearchParams({ fincaId });
      if (filtroEstado === "HISTORICO") {
        params.set("historico", "true");
      } else if (filtroEstado !== "TODOS") {
        params.set("estado", filtroEstado);
      }
      if (filtroLote  !== "TODOS") params.set("loteId", filtroLote);
      if (search) params.set("q", search);
      const res = await fetch(`/api/animales?${params}`);
      if (!res.ok) throw new Error("Error al cargar animales");
      return res.json();
    },
    enabled: !!fincaId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/animales", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, fincaId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["animales"] }); setDialog(null); toast({ title: "✅ Animal registrado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/animales/${selected.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["animales"] }); setDialog(null); setSelected(null); toast({ title: "✅ Animal actualizado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/animales/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["animales"] }); toast({ title: "Animal eliminado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const conteos = {
    total:       animales.length,
    enfermos:    animales.filter((a: any) => a.estado === "ENFERMO").length,
    tratamiento: animales.filter((a: any) => a.estado === "EN_TRATAMIENTO").length,
    preñadas:    animales.filter((a: any) => a.estado === "PRENADA").length,
  };

  async function handleImportar() {
    if (!importFile || !fincaId) return;
    setImportando(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("fincaId", fincaId);
      const res = await fetch("/api/animales/importar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImportResult(data);
      if (data.creados > 0) {
        qc.invalidateQueries({ queryKey: ["animales"] });
        toast({ title: `✅ ${data.creados} animales importados correctamente` });
      }
    } catch (e: any) {
      toast({ title: "Error al importar", description: e.message, variant: "destructive" });
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Animales</h2>
          <p className="text-gray-500 text-sm">{conteos.total} animales registrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href="/plantilla-importacion-animales.xlsx" download>
            <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
              <Download className="w-4 h-4 mr-2" /> Descargar plantilla
            </Button>
          </a>
          <Button variant="outline" className="border-blue-600 text-blue-700 hover:bg-blue-50"
            onClick={() => { setImportFile(null); setImportResult(null); setDialog("importar"); }}>
            <Upload className="w-4 h-4 mr-2" /> Importar Excel
          </Button>
          <Button onClick={() => { setSelected(null); setDialog("crear"); }} className="bg-finca-green-600 hover:bg-finca-green-700">
            <Plus className="w-4 h-4 mr-2" /> Registrar animal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total",       val: conteos.total,       color: "bg-green-50  border-green-200  text-green-700"  },
          { label: "Enfermos",    val: conteos.enfermos,    color: "bg-red-50    border-red-200    text-red-700"    },
          { label: "Tratamiento", val: conteos.tratamiento, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
          { label: "Preñadas",    val: conteos.preñadas,    color: "bg-pink-50   border-pink-200   text-pink-700"   },
        ].map(({ label, val, color }) => (
          <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
            <p className="text-2xl font-bold">{val}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Buscar por código, nombre o raza..." className="pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-44">
            <Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">En finca (todos)</SelectItem>
            {["ACTIVO","ENFERMO","EN_TRATAMIENTO","PRENADA","EN_CELO","SECO"].map(e => (
              <SelectItem key={e} value={e}>{e.replace(/_/g, " ")}</SelectItem>
            ))}
            <SelectItem value="HISTORICO">🗂 Histórico (vendidos/muertos)</SelectItem>
          </SelectContent>
        </Select>
        {lotes.length > 0 && (
          <Select value={filtroLote} onValueChange={setFiltroLote}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Lote" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los lotes</SelectItem>
              {lotes.map((l: any) => (
                <SelectItem key={l.id} value={l.id}>🌿 {l.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : animales.length === 0 ? (
        <EmptyState icon={Beef} title="No hay animales registrados"
          description="Registre su primer animal para comenzar a llevar el control de su ganado."
          action={{ label: "Registrar animal", onClick: () => setDialog("crear") }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {animales.map((animal: any) => (
            <div key={animal.id} className="relative group">
              <AnimalCard animal={animal} />
              {/* Botones editar/eliminar al hacer hover */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button size="sm" variant="secondary" className="h-7 w-7 p-0 shadow"
                  onClick={(e) => { e.preventDefault(); setSelected(animal); setDialog("editar"); }}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="destructive" className="h-7 w-7 p-0 shadow"
                  onClick={(e) => { e.preventDefault(); if (confirm("¿Eliminar este animal?")) deleteMutation.mutate(animal.id); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear */}
      <Dialog open={dialog === "crear"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar nuevo animal</DialogTitle></DialogHeader>
          <AnimalForm fincaId={fincaId} onSubmit={createMutation.mutate}
            loading={createMutation.isPending} onCancel={() => setDialog(null)} />
        </DialogContent>
      </Dialog>

      {/* Modal editar */}
      <Dialog open={dialog === "editar"} onOpenChange={o => { if (!o) { setDialog(null); setSelected(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar animal — {selected?.nombre ?? `#${selected?.codigo}`}</DialogTitle></DialogHeader>
          {selected && (
            <AnimalForm fincaId={fincaId} defaultValues={selected} onSubmit={editMutation.mutate}
              loading={editMutation.isPending} onCancel={() => { setDialog(null); setSelected(null); }} />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal importar */}
      <Dialog open={dialog === "importar"} onOpenChange={o => { if (!o) { setDialog(null); setImportFile(null); setImportResult(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>📤 Importar animales desde Excel</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Use la plantilla oficial para evitar errores. Los animales con código duplicado serán omitidos.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Descarga de plantilla */}
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Download className="w-5 h-5 text-green-700 shrink-0" />
              <div className="flex-1 text-sm text-green-800">
                <p className="font-medium">¿No tiene la plantilla?</p>
                <p className="text-xs text-green-600">Descárguela, llénela y súbala aquí</p>
              </div>
              <a href="/plantilla-importacion-animales.xlsx" download>
                <Button size="sm" variant="outline" className="border-green-600 text-green-700 text-xs">
                  Descargar
                </Button>
              </a>
            </div>

            {/* Selector de archivo */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              {importFile ? (
                <div>
                  <p className="font-medium text-blue-700 text-sm">{importFile.name}</p>
                  <p className="text-xs text-gray-400">{(importFile.size / 1024).toFixed(1)} KB — click para cambiar</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 font-medium">Click para seleccionar archivo</p>
                  <p className="text-xs text-gray-400 mt-1">Solo archivos .xlsx</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setImportFile(f); setImportResult(null); } }} />
            </div>

            {/* Resultados */}
            {importResult && (
              <div className="rounded-lg border p-4 space-y-2 bg-gray-50">
                <div className="flex gap-4 text-sm font-medium">
                  <span className="flex items-center gap-1 text-green-700">
                    <CheckCircle2 className="w-4 h-4" /> {importResult.creados} creados
                  </span>
                  {importResult.errores.length > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" /> {importResult.errores.length} con error
                    </span>
                  )}
                  {importResult.omitidos > 0 && (
                    <span className="text-gray-500">({importResult.omitidos} filas vacías)</span>
                  )}
                </div>
                {importResult.errores.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {importResult.errores.map((e, i) => (
                      <div key={i} className="text-xs bg-red-50 border border-red-100 rounded px-2 py-1">
                        <span className="font-medium text-red-700">Fila {e.fila} [{e.codigo}]:</span> {e.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setDialog(null); setImportFile(null); setImportResult(null); }}>
                {importResult ? "Cerrar" : "Cancelar"}
              </Button>
              {!importResult && (
                <Button disabled={!importFile || importando} onClick={handleImportar}
                  className="bg-blue-600 hover:bg-blue-700">
                  {importando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...</> : <><Upload className="w-4 h-4 mr-2" /> Importar</>}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
