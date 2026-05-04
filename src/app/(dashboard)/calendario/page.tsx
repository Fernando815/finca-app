"use client";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft, ChevronRight, CalendarDays, X,
  Clock, AlertTriangle, CheckCircle2, Circle, Loader2, Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────
interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: string;
  prioridad: string;
  categoria?: string;
  fechaLimite?: string;
  peon?: { nombre: string } | null;
}

interface ItemInventario {
  id: string;
  nombre: string;
  categoria: string;
  estado: string;
  marca?: string;
  modelo?: string;
  proximoMantenimiento?: string;
}

// Evento unificado para el calendario
interface EventoCal {
  id: string;
  tipo: "tarea" | "mantenimiento";
  titulo: string;
  subtitulo?: string;
  fecha: string; // YYYY-MM-DD
  color: string;  // clase bg-*
  colorBadge: string;
  estadoLabel: string;
  extra?: string;
  prioridad?: string;
}

// ── Constants ─────────────────────────────────────────────────
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE:   "bg-yellow-400",
  EN_PROCESO:  "bg-blue-400",
  COMPLETADA:  "bg-green-400",
  VENCIDA:     "bg-red-400",
};
const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente", EN_PROCESO: "En proceso",
  COMPLETADA: "Completada", VENCIDA: "Vencida",
};
const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE:  "bg-yellow-100 text-yellow-800",
  EN_PROCESO: "bg-blue-100 text-blue-800",
  COMPLETADA: "bg-green-100 text-green-800",
  VENCIDA:    "bg-red-100 text-red-800",
};
const PRIORIDAD_COLOR: Record<string, string> = {
  BAJA: "text-gray-400", MEDIA: "text-blue-500",
  ALTA: "text-orange-500", URGENTE: "text-red-600",
};
const PRIORIDAD_LABEL: Record<string, string> = {
  BAJA:"Baja", MEDIA:"Media", ALTA:"Alta", URGENTE:"Urgente",
};

function EstadoIcon({ estado }: { estado: string }) {
  if (estado === "COMPLETADA") return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
  if (estado === "VENCIDA")    return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
  if (estado === "EN_PROCESO") return <Clock className="w-3.5 h-3.5 text-blue-500" />;
  return <Circle className="w-3.5 h-3.5 text-yellow-500" />;
}

// ── Helpers ───────────────────────────────────────────────────
function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function fechaKey(fechaLimite?: string) {
  if (!fechaLimite) return null;
  return fechaLimite.slice(0, 10);
}

// ── Page ──────────────────────────────────────────────────────
export default function CalendarioPage() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [fincaId, setFincaId] = useState("");
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/fincas").then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) setFincaId(d[0].id);
    });
  }, []);

  const { data: tareas = [], isLoading: loadingTareas } = useQuery<Tarea[]>({
    queryKey: ["tareas-calendario", fincaId],
    queryFn: () => fetch(`/api/tareas?fincaId=${fincaId}`).then(r => r.json()),
    enabled: !!fincaId,
  });

  const { data: inventario = [], isLoading: loadingInv } = useQuery<ItemInventario[]>({
    queryKey: ["inventario-calendario", fincaId],
    queryFn: () => fetch(`/api/inventario?fincaId=${fincaId}`).then(r => r.json()),
    enabled: !!fincaId,
  });

  const isLoading = loadingTareas || loadingInv;

  // ── Convertir inventario items con mantenimiento a EventoCal ──
  const eventosMantenimiento = useMemo((): EventoCal[] => {
    return inventario
      .filter(i => i.proximoMantenimiento && i.estado !== "DADO_DE_BAJA")
      .map(i => {
        const fecha = i.proximoMantenimiento!.slice(0, 10);
        const dias = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000);
        const vencido = dias < 0;
        const proximo = dias >= 0 && dias <= 7;
        return {
          id: `mant-${i.id}`,
          tipo: "mantenimiento" as const,
          titulo: i.nombre,
          subtitulo: [i.marca, i.modelo].filter(Boolean).join(" "),
          fecha,
          color: vencido ? "bg-red-500" : proximo ? "bg-orange-400" : "bg-purple-400",
          colorBadge: vencido ? "bg-red-100 text-red-800" : proximo ? "bg-orange-100 text-orange-800" : "bg-purple-100 text-purple-800",
          estadoLabel: vencido ? "Mant. vencido" : proximo ? `Mant. en ${dias}d` : "Mantenimiento",
        };
      });
  }, [inventario]);

  // ── Convertir tareas a EventoCal ──
  const eventosTareas = useMemo((): EventoCal[] => {
    return tareas
      .filter(t => t.fechaLimite)
      .map(t => ({
        id: t.id,
        tipo: "tarea" as const,
        titulo: t.titulo,
        fecha: t.fechaLimite!.slice(0, 10),
        color: ESTADO_COLOR[t.estado] ?? "bg-gray-400",
        colorBadge: ESTADO_BADGE[t.estado] ?? "bg-gray-100 text-gray-700",
        estadoLabel: ESTADO_LABEL[t.estado] ?? t.estado,
        extra: t.peon?.nombre,
        prioridad: t.prioridad,
      }));
  }, [tareas]);

  // ── Todos los eventos agrupados por fecha ──
  const eventosPorFecha = useMemo(() => {
    const map: Record<string, EventoCal[]> = {};
    for (const e of [...eventosTareas, ...eventosMantenimiento]) {
      if (!map[e.fecha]) map[e.fecha] = [];
      map[e.fecha].push(e);
    }
    return map;
  }, [eventosTareas, eventosMantenimiento]);

  // ── Calendar grid ──
  const diasDelMes = useMemo(() => {
    const primer = new Date(year, month, 1);
    const ultimo = new Date(year, month + 1, 0);
    const celdas: (Date | null)[] = [];
    for (let i = 0; i < primer.getDay(); i++) celdas.push(null);
    for (let d = 1; d <= ultimo.getDate(); d++) celdas.push(new Date(year, month, d));
    while (celdas.length % 7 !== 0) celdas.push(null);
    return celdas;
  }, [year, month]);

  // ── Stats for header ──
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const tareasMes = useMemo(() => tareas.filter(t => t.fechaLimite?.startsWith(prefix)), [tareas, prefix]);
  const mantMes   = useMemo(() => eventosMantenimiento.filter(e => e.fecha.startsWith(prefix)), [eventosMantenimiento, prefix]);

  const statsMap = useMemo(() => {
    const m: Record<string, number> = { PENDIENTE: 0, EN_PROCESO: 0, COMPLETADA: 0, VENCIDA: 0 };
    tareasMes.forEach(t => { if (m[t.estado] !== undefined) m[t.estado]++; });
    return m;
  }, [tareasMes]);

  function prevMes() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMes() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const eventosDelDia = diaSeleccionado ? (eventosPorFecha[diaSeleccionado] ?? []) : [];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendario</h2>
          <p className="text-gray-500 text-sm">
            {tareasMes.length} tareas · {mantMes.length} mantenimientos en {MESES[month]}
          </p>
        </div>
        {/* Resumen del mes */}
        <div className="flex gap-2 flex-wrap">
          {(["PENDIENTE","EN_PROCESO","VENCIDA","COMPLETADA"] as const).map(e => (
            statsMap[e] > 0 && (
              <div key={e} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", ESTADO_BADGE[e])}>
                <span className={cn("w-2 h-2 rounded-full", ESTADO_COLOR[e])} />
                {statsMap[e]} {ESTADO_LABEL[e]}
              </div>
            )
          ))}
        </div>
      </div>

      {/* ── Navegación mes ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Button variant="ghost" size="icon" onClick={prevMes} className="rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-bold text-gray-900 capitalize">
            {MESES[month]} {year}
          </h3>
          <Button variant="ghost" size="icon" onClick={nextMes} className="rounded-xl">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* ── Días semana header ── */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-finca-green-600" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {diasDelMes.map((dia, idx) => {
              if (!dia) return <div key={`empty-${idx}`} className="min-h-[80px] border-b border-r border-gray-50 last:border-r-0" />;

              const key = toDateKey(dia);
              const esHoy = toDateKey(today) === key;
              const seleccionado = diaSeleccionado === key;
              const eventos = eventosPorFecha[key] ?? [];
              const tieneVencida = eventos.some(e => e.estadoLabel.includes("vencid") || (e.tipo === "tarea" && e.estadoLabel === "Vencida"));
              const tieneUrgente = eventos.some(e => e.prioridad === "URGENTE");

              return (
                <div
                  key={key}
                  onClick={() => setDiaSeleccionado(seleccionado ? null : key)}
                  className={cn(
                    "min-h-[80px] border-b border-r border-gray-50 p-1.5 cursor-pointer transition-all last:border-r-0",
                    seleccionado ? "bg-finca-green-50 border-finca-green-200" : "hover:bg-gray-50",
                    esHoy && !seleccionado && "bg-blue-50/50"
                  )}
                >
                  {/* Número del día */}
                  <div className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1 mx-auto",
                    esHoy ? "bg-finca-green-600 text-white" : "text-gray-700",
                    tieneVencida && !esHoy ? "text-red-600" : "",
                    tieneUrgente && !esHoy && !tieneVencida ? "text-orange-600" : "",
                  )}>
                    {dia.getDate()}
                  </div>

                  {/* Puntos de eventos (máx 4 visibles) */}
                  {eventos.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {eventos.slice(0, 4).map(e => (
                        <span
                          key={e.id}
                          className={cn("w-2 h-2 rounded-full flex-shrink-0", e.color)}
                          title={e.titulo}
                        />
                      ))}
                      {eventos.length > 4 && (
                        <span className="text-[9px] text-gray-400 font-bold leading-none mt-0.5">
                          +{eventos.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Etiquetas en pantallas grandes (máx 2) */}
                  <div className="hidden md:block mt-0.5 space-y-0.5">
                    {eventos.slice(0, 2).map(e => (
                      <div
                        key={e.id}
                        className={cn(
                          "text-[10px] leading-tight px-1 rounded truncate flex items-center gap-0.5",
                          e.colorBadge
                        )}
                      >
                        {e.tipo === "mantenimiento" && <Wrench className="w-2 h-2 flex-shrink-0" />}
                        {e.titulo}
                      </div>
                    ))}
                    {eventos.length > 2 && (
                      <div className="text-[10px] text-gray-400 px-1">+{eventos.length - 2} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Leyenda ── */}
      <div className="flex gap-3 flex-wrap text-xs text-gray-500">
        {Object.entries(ESTADO_COLOR).map(([estado, color]) => (
          <div key={estado} className="flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-full", color)} />
            {ESTADO_LABEL[estado]}
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          Mantenimiento
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          Mant. próximo
        </div>
      </div>

      {/* ── Panel — eventos del día seleccionado ── */}
      {diaSeleccionado && (
        <div className="bg-white rounded-2xl border border-finca-green-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-finca-green-600" />
              <h3 className="font-bold text-gray-900">
                {new Date(diaSeleccionado + "T12:00:00").toLocaleDateString("es-CR", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric"
                })}
              </h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDiaSeleccionado(null)} className="rounded-xl h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {eventosDelDia.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No hay eventos para este día.</p>
          ) : (
            <div className="space-y-2">
              {/* Tareas del día */}
              {eventosDelDia.filter(e => e.tipo === "tarea").length > 0 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tareas</p>
              )}
              {eventosDelDia.filter(e => e.tipo === "tarea").map(ev => {
                const t = tareas.find(x => x.id === ev.id);
                if (!t) return null;
                return (
                  <div
                    key={ev.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border",
                      t.estado === "VENCIDA"    ? "bg-red-50 border-red-100" :
                      t.estado === "COMPLETADA" ? "bg-green-50 border-green-100" :
                    t.estado === "EN_PROCESO" ? "bg-blue-50 border-blue-100" :
                    "bg-yellow-50 border-yellow-100"
                  )}
                >
                  <EstadoIcon estado={t.estado} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm font-semibold leading-tight",
                        t.estado === "COMPLETADA" ? "line-through text-gray-400" : "text-gray-900"
                      )}>
                        {t.titulo}
                      </p>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Badge className={cn("text-[10px] py-0 px-1.5", ESTADO_BADGE[t.estado])}>
                          {ESTADO_LABEL[t.estado]}
                        </Badge>
                        {t.prioridad !== "BAJA" && (
                          <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5", PRIORIDAD_COLOR[t.prioridad])}>
                            {PRIORIDAD_LABEL[t.prioridad]}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {t.descripcion && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.descripcion}</p>
                    )}
                    {t.peon && (
                      <p className="text-xs text-gray-400 mt-1">👤 {t.peon.nombre}</p>
                    )}
                    {t.categoria && (
                      <p className="text-xs text-gray-400">📂 {t.categoria}</p>
                    )}
                  </div>
                </div>
                );
              })}

              {/* Mantenimientos del día */}
              {eventosDelDia.filter(e => e.tipo === "mantenimiento").length > 0 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Mantenimientos</p>
              )}
              {eventosDelDia.filter(e => e.tipo === "mantenimiento").map(ev => {
                const item = inventario.find(x => `mant-${x.id}` === ev.id);
                const dias = Math.ceil((new Date(ev.fecha).getTime() - Date.now()) / 86400000);
                const vencido = dias < 0;
                return (
                  <div
                    key={ev.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border",
                      vencido ? "bg-red-50 border-red-100" : "bg-purple-50 border-purple-100"
                    )}
                  >
                    <Wrench className={cn("w-4 h-4 mt-0.5 flex-shrink-0", vencido ? "text-red-500" : "text-purple-500")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">{ev.titulo}</p>
                        <Badge className={cn("text-[10px] py-0 px-1.5 flex-shrink-0", ev.colorBadge)}>
                          {vencido ? "Vencido" : dias === 0 ? "Hoy" : `En ${dias}d`}
                        </Badge>
                      </div>
                      {ev.subtitulo && (
                        <p className="text-xs text-gray-500 mt-0.5">{ev.subtitulo}</p>
                      )}
                      {item && (
                        <p className="text-xs text-gray-400 mt-1">🔧 {item.categoria.replace(/_/g, " ").toLowerCase()}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Lista tareas sin fecha ── */}
      {(() => {
        const sinFecha = tareas.filter(t => !t.fechaLimite && t.estado !== "COMPLETADA");
        if (sinFecha.length === 0) return null;
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Tareas sin fecha límite ({sinFecha.length})
            </h3>
            <div className="space-y-2">
              {sinFecha.map(t => (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <EstadoIcon estado={t.estado} />
                  <span className="text-gray-700 flex-1 truncate">{t.titulo}</span>
                  <Badge className={cn("text-[10px]", ESTADO_BADGE[t.estado])}>{ESTADO_LABEL[t.estado]}</Badge>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
