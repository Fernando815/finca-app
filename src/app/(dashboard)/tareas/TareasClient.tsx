"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckSquare, Clock, Check, Trash2, UserCheck, Pencil, Calendar, Tag, AlertTriangle, FileText } from "lucide-react";import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { TareaForm } from "@/components/tareas/TareaForm";
import { cn, getPrioridadColor, formatFecha } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE:  "bg-yellow-100 text-yellow-800",
  EN_PROCESO: "bg-blue-100 text-blue-800",
  COMPLETADA: "bg-green-100 text-green-800",
  VENCIDA:    "bg-red-100 text-red-800",
  CANCELADA:  "bg-gray-100 text-gray-500",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente", EN_PROCESO: "En proceso",
  COMPLETADA: "Completada", VENCIDA: "Vencida", CANCELADA: "Cancelada",
};

export default function TareasPage() {
  const searchParams = useSearchParams();
  const [modalNueva, setModalNueva] = useState(searchParams.get("nuevo") === "1");
  const [filtroEstado, setFiltroEstado] = useState("ACTIVAS");
  const [fincaId, setFincaId] = useState("");
  const [tareaEditando, setTareaEditando] = useState<any>(null);
  const [tareaDetalle, setTareaDetalle] = useState<any>(null);
  // completandose: taskId → timestamp when it was completed (shown for 10 min)
  const [completandose, setCompletandose] = useState<Record<string, number>>({});
  const timersRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    fetch("/api/fincas").then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) setFincaId(data[0].id);
    });
  }, []);

  const { data: tareas = [], isLoading } = useQuery({
    queryKey: ["tareas", fincaId, filtroEstado],
    queryFn: async () => {
      const params = new URLSearchParams({ fincaId });
      if (filtroEstado !== "TODAS" && filtroEstado !== "ACTIVAS") params.set("estado", filtroEstado);
      const res = await fetch(`/api/tareas?${params}`);
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      if (filtroEstado === "ACTIVAS") {
        // Show active tasks + recently completed (still within 10-min window)
        return data.filter((t: any) =>
          ["PENDIENTE","EN_PROCESO","VENCIDA"].includes(t.estado) || completandose[t.id]
        );
      }
      return data;
    },
    enabled: !!fincaId,
  });

  const crearMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, fincaId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tareas"] }); setModalNueva(false); toast({ title: "Tarea creada" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const editarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/tareas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tareas"] });
      setTareaEditando(null);
      toast({ title: "Tarea actualizada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const ARCHIVE_DELAY = 10 * 60 * 1000; // 10 minutes

  function marcarCompletada(id: string) {
    // Clear any existing timer for this task
    if (timersRef.current[id]) clearTimeout(timersRef.current[id]);

    // Mark in DB
    fetch(`/api/tareas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "COMPLETADA" }),
    });

    // Add to "completing" set
    setCompletandose(prev => ({ ...prev, [id]: Date.now() }));
    qc.invalidateQueries({ queryKey: ["tareas"] });

    // After 10 min, remove from visible set
    timersRef.current[id] = setTimeout(() => {
      setCompletandose(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["tareas"] });
    }, ARCHIVE_DELAY);
  }

  function desmarcarCompletada(id: string) {
    if (timersRef.current[id]) { clearTimeout(timersRef.current[id]); delete timersRef.current[id]; }
    setCompletandose(prev => { const n = { ...prev }; delete n[id]; return n; });
    fetch(`/api/tareas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "PENDIENTE" }),
    }).then(() => qc.invalidateQueries({ queryKey: ["tareas"] }));
  }

  const actualizarMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const res = await fetch(`/api/tareas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tareas"] }),
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tareas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tareas"] }); toast({ title: "Tarea eliminada" }); },
  });

  // Conteos siempre sobre todos los datos (query sin filtro de estado)
  const { data: todasTareas = [] } = useQuery({
    queryKey: ["tareas-conteos", fincaId],
    queryFn: async () => {
      const res = await fetch(`/api/tareas?fincaId=${fincaId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!fincaId,
  });

  const conteos = {
    pendientes:  todasTareas.filter((t: any) => t.estado === "PENDIENTE").length,
    proceso:     todasTareas.filter((t: any) => t.estado === "EN_PROCESO").length,
    vencidas:    todasTareas.filter((t: any) => t.estado === "VENCIDA").length,
    completadas: todasTareas.filter((t: any) => t.estado === "COMPLETADA").length,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tareas de Finca</h2>
          <p className="text-gray-500 text-sm">{tareas.length} tareas</p>
        </div>
        <Button onClick={() => setModalNueva(true)} className="bg-finca-green-600 hover:bg-finca-green-700">
          <Plus className="w-4 h-4 mr-2" /> Nueva tarea
        </Button>
      </div>

      {/* Resumen — clic para filtrar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pendientes",  val: conteos.pendientes,  filtro: "PENDIENTE",  base: "bg-yellow-50 border-yellow-200 text-yellow-700", active: "ring-2 ring-yellow-400 shadow-md scale-105" },
          { label: "En proceso",  val: conteos.proceso,     filtro: "EN_PROCESO", base: "bg-blue-50   border-blue-200   text-blue-700",   active: "ring-2 ring-blue-400   shadow-md scale-105" },
          { label: "Vencidas",    val: conteos.vencidas,    filtro: "VENCIDA",    base: "bg-red-50    border-red-200    text-red-700",    active: "ring-2 ring-red-400    shadow-md scale-105" },
          { label: "Completadas", val: conteos.completadas, filtro: "COMPLETADA", base: "bg-green-50  border-green-200  text-green-700",  active: "ring-2 ring-green-400  shadow-md scale-105" },
        ].map(({ label, val, filtro, base, active }) => (
          <button
            key={label}
            onClick={() => setFiltroEstado(prev => prev === filtro ? "ACTIVAS" : filtro)}
            className={cn(
              `rounded-xl border p-3 text-center transition-all cursor-pointer hover:shadow-md ${base}`,
              filtroEstado === filtro && active
            )}
          >
            <p className="text-2xl font-bold">{val}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Filtro */}
      <Select value={filtroEstado} onValueChange={setFiltroEstado}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ACTIVAS">Tareas activas</SelectItem>
          <SelectItem value="TODAS">Todas</SelectItem>
          <SelectItem value="PENDIENTE">Pendientes</SelectItem>
          <SelectItem value="EN_PROCESO">En proceso</SelectItem>
          <SelectItem value="VENCIDA">Vencidas</SelectItem>
          <SelectItem value="COMPLETADA">Completadas</SelectItem>
        </SelectContent>
      </Select>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : tareas.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No hay tareas"
          description="Cree sus primeras tareas para organizar el trabajo de la finca."
          action={{ label: "Nueva tarea", onClick: () => setModalNueva(true) }}
        />
      ) : (
        <div className="space-y-3">
          {tareas.map((tarea: any) => {
            const recienCompletada = !!completandose[tarea.id];
            const msRestantes = recienCompletada ? Math.max(0, ARCHIVE_DELAY - (Date.now() - completandose[tarea.id])) : 0;
            const minRestantes = Math.ceil(msRestantes / 60000);

            return (
            <div
              key={tarea.id}
              className={cn(
                "rounded-2xl border shadow-sm p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition-all",
                recienCompletada
                  ? "bg-green-50 border-green-200"
                  : tarea.estado === "VENCIDA"
                    ? "border-red-200 bg-red-50"
                    : "bg-white border-gray-100"
              )}
              onClick={() => setTareaDetalle(tarea)}
            >
              {/* Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (recienCompletada || tarea.estado === "COMPLETADA") {
                    desmarcarCompletada(tarea.id);
                  } else {
                    marcarCompletada(tarea.id);
                  }
                }}
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                  recienCompletada || tarea.estado === "COMPLETADA"
                    ? "bg-finca-green-600 border-finca-green-600"
                    : "border-gray-300 hover:border-finca-green-500"
                )}
              >
                {(recienCompletada || tarea.estado === "COMPLETADA") && <Check className="w-3.5 h-3.5 text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className={cn(
                    "font-medium",
                    recienCompletada || tarea.estado === "COMPLETADA"
                      ? "line-through text-gray-400"
                      : "text-gray-900"
                  )}>
                    {tarea.titulo}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {recienCompletada && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Se archiva en {minRestantes}m
                      </span>
                    )}
                    {!recienCompletada && (
                      <Badge className={cn("text-xs border", getPrioridadColor(tarea.prioridad))}>
                        {tarea.prioridad}
                      </Badge>
                    )}
                    <Badge className={cn("text-xs", recienCompletada ? "bg-green-100 text-green-800" : ESTADO_COLOR[tarea.estado])}>
                      {recienCompletada ? "Completada" : tarea.estado.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                {tarea.descripcion && (
                  <p className="text-sm text-gray-500 mt-1 truncate">{tarea.descripcion}</p>
                )}

                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                  {tarea.fechaLimite && (
                    <span className={cn("flex items-center gap-1", tarea.estado === "VENCIDA" && !recienCompletada && "text-red-500 font-medium")}>
                      <Clock className="w-3 h-3" />
                      {formatFecha(tarea.fechaLimite)}
                    </span>
                  )}
                  <span className="capitalize">{tarea.categoria.toLowerCase()}</span>
                  {tarea.peon && (
                    <span className="flex items-center gap-1 bg-finca-green-50 text-finca-green-700 px-2 py-0.5 rounded-full font-medium">
                      <UserCheck className="w-3 h-3" />
                      {tarea.peon.nombre}
                    </span>
                  )}
                </div>
              </div>

              <Button
                size="sm" variant="ghost"
                className="text-gray-400 hover:text-finca-green-600 flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); setTareaEditando(tarea); }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm" variant="ghost"
                className="text-gray-400 hover:text-red-500 flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); eliminarMutation.mutate(tarea.id); }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            );
          })}
        </div>
      )}

      {/* Modal Nueva Tarea */}
      <Dialog open={modalNueva} onOpenChange={setModalNueva}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva tarea</DialogTitle></DialogHeader>
          <TareaForm fincaId={fincaId} onSubmit={crearMutation.mutate} loading={crearMutation.isPending} onCancel={() => setModalNueva(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal Editar Tarea */}
      <Dialog open={!!tareaEditando} onOpenChange={(open) => { if (!open) setTareaEditando(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar tarea</DialogTitle></DialogHeader>
          {tareaEditando && (
            <TareaForm
              fincaId={fincaId}
              editMode
              defaultValues={{
                titulo: tareaEditando.titulo,
                descripcion: tareaEditando.descripcion ?? "",
                prioridad: tareaEditando.prioridad,
                categoria: tareaEditando.categoria,
                fechaLimite: tareaEditando.fechaLimite ? tareaEditando.fechaLimite.slice(0, 10) : undefined,
                peonId: tareaEditando.peon?.id,
                estado: tareaEditando.estado,
                fincaId,
              }}
              onSubmit={(data) => editarMutation.mutate({ id: tareaEditando.id, data })}
              loading={editarMutation.isPending}
              onCancel={() => setTareaEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Detalle Tarea */}
      <Dialog open={!!tareaDetalle} onOpenChange={(open) => { if (!open) setTareaDetalle(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-finca-green-600" />
              Detalle de tarea
            </DialogTitle>
          </DialogHeader>
          {tareaDetalle && (
            <div className="space-y-4">
              {/* Título */}
              <div>
                <p className="text-lg font-semibold text-gray-900">{tareaDetalle.titulo}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={cn("text-xs border", getPrioridadColor(tareaDetalle.prioridad))}>
                    {tareaDetalle.prioridad}
                  </Badge>
                  <Badge className={cn("text-xs", ESTADO_COLOR[tareaDetalle.estado])}>
                    {ESTADO_LABEL[tareaDetalle.estado] ?? tareaDetalle.estado}
                  </Badge>
                </div>
              </div>

              {/* Descripción */}
              {tareaDetalle.descripcion && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Descripción</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{tareaDetalle.descripcion}</p>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Categoría
                  </p>
                  <p className="text-sm font-medium capitalize">{tareaDetalle.categoria.toLowerCase()}</p>
                </div>

                {tareaDetalle.fechaLimite && (
                  <div className={cn(
                    "rounded-xl p-3",
                    tareaDetalle.estado === "VENCIDA" ? "bg-red-50" : "bg-gray-50"
                  )}>
                    <p className={cn(
                      "text-xs font-medium mb-1 flex items-center gap-1",
                      tareaDetalle.estado === "VENCIDA" ? "text-red-500" : "text-gray-500"
                    )}>
                      <Calendar className="w-3 h-3" /> Fecha límite
                    </p>
                    <p className={cn(
                      "text-sm font-medium",
                      tareaDetalle.estado === "VENCIDA" && "text-red-600"
                    )}>
                      {formatFecha(tareaDetalle.fechaLimite)}
                    </p>
                  </div>
                )}
              </div>

              {/* Peón asignado */}
              {tareaDetalle.peon && (
                <div className="bg-finca-green-50 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-finca-green-100 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-finca-green-700" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-finca-green-600">Peón asignado</p>
                    <p className="text-sm font-semibold text-finca-green-800">{tareaDetalle.peon.nombre}</p>
                    {tareaDetalle.peon.cargo && (
                      <p className="text-xs text-finca-green-600 capitalize">{tareaDetalle.peon.cargo.toLowerCase()}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Alerta vencida */}
              {tareaDetalle.estado === "VENCIDA" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">Esta tarea está vencida</p>
                </div>
              )}

              {/* Fecha creación */}
              {tareaDetalle.creadaEn && (
                <p className="text-xs text-gray-400 text-center">
                  Creada el {formatFecha(tareaDetalle.creadaEn)}
                </p>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setTareaDetalle(null);
                    setTareaEditando(tareaDetalle);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </Button>
                <Button
                  className="flex-1 bg-finca-green-600 hover:bg-finca-green-700"
                  onClick={() => {
                    if (tareaDetalle.estado === "COMPLETADA" || completandose[tareaDetalle.id]) {
                      desmarcarCompletada(tareaDetalle.id);
                    } else {
                      marcarCompletada(tareaDetalle.id);
                    }
                    setTareaDetalle(null);
                  }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {tareaDetalle.estado === "COMPLETADA" || completandose[tareaDetalle.id] ? "Reabrir" : "Completar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
