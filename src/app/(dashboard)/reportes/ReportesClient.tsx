"use client";
import {
  BarChart3, Beef, Sprout, CheckSquare, MapPin,
  HardHat, Wrench, AlertTriangle, CalendarClock, Clock, Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PDFButton } from "./PDFButton";

// ── Constantes ───────────────────────────────────────────────
const ESTADO_ANIMAL: Record<string, { label: string; color: string }> = {
  ACTIVO:         { label: "Activo",         color: "bg-green-500" },
  ENFERMO:        { label: "Enfermo",         color: "bg-red-500" },
  EN_TRATAMIENTO: { label: "En tratamiento",  color: "bg-amber-500" },
  PRENADA:        { label: "Preñada",         color: "bg-blue-500" },
  VENDIDO:        { label: "Vendido",         color: "bg-stone-400" },
  MUERTO:         { label: "Muerto",          color: "bg-stone-600" },
  EN_CELO:        { label: "En celo",         color: "bg-violet-500" },
  SECO:           { label: "Seco",            color: "bg-orange-400" },
};
const ESTADO_TAREA: Record<string, { label: string; color: string }> = {
  PENDIENTE:  { label: "Pendiente",   color: "bg-amber-400" },
  EN_PROCESO: { label: "En proceso",  color: "bg-blue-400" },
  COMPLETADA: { label: "Completada",  color: "bg-green-500" },
  VENCIDA:    { label: "Vencida",     color: "bg-red-500" },
  CANCELADA:  { label: "Cancelada",   color: "bg-stone-400" },
};
const PRIORIDAD_BADGE: Record<string, string> = {
  BAJA: "bg-gray-100 text-gray-600", MEDIA: "bg-blue-100 text-blue-700",
  ALTA: "bg-orange-100 text-orange-700", URGENTE: "bg-red-100 text-red-700",
};

// ── Helpers ──────────────────────────────────────────────────
function MiniBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-stone-600 w-32 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-stone-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-stone-700 w-8 text-right">{value}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children, className }: { icon: any; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-stone-100 shadow-sm p-5 print:shadow-none print:border-stone-300 print:rounded-none print:break-inside-avoid", className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-finca-green-50 rounded-xl flex items-center justify-center print:bg-gray-100">
          <Icon className="w-4 h-4 text-finca-green-600" />
        </div>
        <h3 className="font-semibold text-stone-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function AlertaRow({ icon: Icon, color, text }: { icon: any; color: string; text: string }) {
  return (
    <div className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm", color)}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function ReportesClient({ data }: { data: any }) {
  const {
    finca, hoy,
    totalAnimales, animalesPorEstado, animalesPorTipo,
    totalCultivos, cultivosPorTipo,
    totalTareas, tareasPorEstado, tareasProximas, tareasVencidas,
    totalPotreros, potreros,
    laboresRecientes, movimientosRecientes,
    totalPeones, peonesPorEstado,
    totalInventario, stockBajo, mantVencido, mantProximo,
  } = data;

  const fechaReporte = format(new Date(hoy), "d 'de' MMMM, yyyy", { locale: es });
  const alertasTotal = tareasVencidas.length + stockBajo.length + mantVencido.length;
  const nombreArchivo = `Reporte_${finca.nombre.replace(/\s+/g, "_")}_${format(new Date(hoy), "yyyyMMdd")}.pdf`;

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-finca-green-600" /> Reportes
            </h2>
            <p className="text-stone-500 text-sm mt-0.5">
              Resumen de <strong>{finca.nombre}</strong> · {fechaReporte}
            </p>
          </div>
          <PDFButton data={data} fileName={nombreArchivo} />
        </div>

        {/* ── Alertas ── */}
        {alertasTotal > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
            <p className="font-semibold text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {alertasTotal} alerta{alertasTotal !== 1 ? "s" : ""} activa{alertasTotal !== 1 ? "s" : ""}
            </p>
            {tareasVencidas.slice(0, 3).map((t: any) => (
              <AlertaRow key={t.id} icon={CheckSquare} color="text-red-600 bg-red-100" text={`Tarea vencida: ${t.titulo}`} />
            ))}
            {stockBajo.slice(0, 3).map((i: any) => (
              <AlertaRow key={i.id} icon={Wrench} color="text-orange-700 bg-orange-100" text={`Stock bajo: ${i.nombre} (${i.cantidad} ${i.unidad})`} />
            ))}
            {mantVencido.slice(0, 3).map((i: any) => (
              <AlertaRow key={i.id} icon={CalendarClock} color="text-purple-700 bg-purple-100" text={`Mantenimiento vencido: ${i.nombre}`} />
            ))}
          </div>
        )}

        {/* ── Stats globales ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Animales",   value: totalAnimales,   emoji: "🐄", color: "text-finca-green-600" },
            { label: "Cultivos",   value: totalCultivos,   emoji: "🌱", color: "text-emerald-600" },
            { label: "Tareas",     value: totalTareas,     emoji: "✅", color: "text-blue-600" },
            { label: "Potreros",   value: totalPotreros,   emoji: "🌿", color: "text-amber-600" },
            { label: "Peones",     value: totalPeones,     emoji: "👷", color: "text-indigo-600" },
            { label: "Inventario", value: totalInventario, emoji: "🔧", color: "text-orange-600" },
            { label: "Stock bajo", value: stockBajo.length, emoji: "⚠️", color: stockBajo.length > 0 ? "text-red-600" : "text-gray-400" },
            { label: "Mant. próx.", value: mantProximo.length, emoji: "🔔", color: mantProximo.length > 0 ? "text-purple-600" : "text-gray-400" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 text-center print:border-stone-300">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Animales por estado */}
          <Section icon={Beef} title="Animales por estado">
            <div className="space-y-2">
              {animalesPorEstado.map((g: any) => {
                const cfg = ESTADO_ANIMAL[g.estado] ?? { label: g.estado, color: "bg-stone-300" };
                return <MiniBar key={g.estado} label={cfg.label} value={g._count._all} total={totalAnimales} color={cfg.color} />;
              })}
              {animalesPorEstado.length === 0 && <p className="text-sm text-stone-400 text-center py-4">Sin datos</p>}
            </div>
          </Section>

          {/* Animales por tipo */}
          <Section icon={Beef} title="Animales por tipo">
            <div className="space-y-2">
              {animalesPorTipo.map((g: any) => (
                <MiniBar key={g.tipo} label={g.tipo.charAt(0) + g.tipo.slice(1).toLowerCase()} value={g._count._all} total={totalAnimales} color="bg-finca-green-500" />
              ))}
              {animalesPorTipo.length === 0 && <p className="text-sm text-stone-400 text-center py-4">Sin datos</p>}
            </div>
          </Section>

          {/* Tareas por estado */}
          <Section icon={CheckSquare} title="Tareas por estado">
            <div className="space-y-2">
              {tareasPorEstado.map((g: any) => {
                const cfg = ESTADO_TAREA[g.estado] ?? { label: g.estado, color: "bg-stone-300" };
                return <MiniBar key={g.estado} label={cfg.label} value={g._count._all} total={totalTareas} color={cfg.color} />;
              })}
              {tareasPorEstado.length === 0 && <p className="text-sm text-stone-400 text-center py-4">Sin datos</p>}
            </div>
          </Section>

          {/* Cultivos por tipo */}
          <Section icon={Sprout} title="Cultivos por tipo">
            <div className="space-y-2">
              {cultivosPorTipo.map((g: any) => (
                <MiniBar key={g.tipo} label={g.tipo.charAt(0) + g.tipo.slice(1).toLowerCase()} value={g._count._all} total={totalCultivos} color="bg-emerald-500" />
              ))}
              {cultivosPorTipo.length === 0 && <p className="text-sm text-stone-400 text-center py-4">Sin datos</p>}
            </div>
          </Section>
        </div>

        {/* Tareas próximas 7 días */}
        {tareasProximas.length > 0 && (
          <Section icon={Clock} title="Tareas próximas (7 días)">
            <div className="space-y-2">
              {tareasProximas.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{t.titulo}</p>
                    {t.peon && <p className="text-xs text-stone-400">👤 {t.peon.nombre}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <Badge className={cn("text-[10px]", PRIORIDAD_BADGE[t.prioridad])}>{t.prioridad}</Badge>
                    <span className="text-xs text-stone-500">
                      {t.fechaLimite ? format(new Date(t.fechaLimite), "d MMM", { locale: es }) : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Potreros */}
        <Section icon={MapPin} title="Estado de potreros">
          {potreros.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-4">Sin potreros registrados</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {potreros.map((p: any) => {
                const mov = p.movimientos?.[0];
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{p.nombre}</p>
                      <p className="text-xs text-stone-400">{p.areHectareas} ha · cap. {p.capacidadAnimales}</p>
                    </div>
                    {mov ? (
                      <Badge className="bg-green-100 text-green-800 text-[10px]">Lote: {mov.lote?.nombre}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-stone-400">Libre</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Peones */}
        {totalPeones > 0 && (
          <Section icon={HardHat} title={`Peones (${totalPeones})`}>
            <div className="flex gap-3 flex-wrap">
              {peonesPorEstado.map((g: any) => (
                <div key={g.estado} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                  <Users className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-sm font-semibold text-stone-700">{g._count._all}</span>
                  <span className="text-xs text-stone-500 capitalize">{g.estado.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Inventario alertas */}
        {totalInventario > 0 && (
          <Section icon={Wrench} title={`Inventario (${totalInventario} items)`}>
            <div className="space-y-3">
              {stockBajo.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-orange-600 mb-2">⚠️ Stock bajo</p>
                  <div className="space-y-1">
                    {stockBajo.map((i: any) => (
                      <div key={i.id} className="flex items-center justify-between text-sm py-1 border-b border-stone-50 last:border-0">
                        <span className="text-stone-700">{i.nombre}</span>
                        <span className="text-orange-600 font-semibold text-xs">{i.cantidad} / {i.cantidadMinima} {i.unidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {mantProximo.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-purple-600 mb-2">🔔 Mantenimiento próximo (7 días)</p>
                  <div className="space-y-1">
                    {mantProximo.map((i: any) => (
                      <div key={i.id} className="flex items-center justify-between text-sm py-1 border-b border-stone-50 last:border-0">
                        <span className="text-stone-700">{i.nombre}</span>
                        <span className="text-purple-600 text-xs">{format(new Date(i.proximoMantenimiento), "d MMM", { locale: es })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stockBajo.length === 0 && mantProximo.length === 0 && (
                <p className="text-sm text-green-600 flex items-center gap-2">✅ Sin alertas de inventario</p>
              )}
            </div>
          </Section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Labores recientes */}
          <Section icon={Sprout} title="Últimas labores agrícolas">
            {laboresRecientes.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-6">Sin labores registradas</p>
            ) : (
              <div className="space-y-1">
                {laboresRecientes.map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-stone-800 capitalize">{l.tipo.replace(/_/g, " ").toLowerCase()}</p>
                      <p className="text-[11px] text-stone-400 capitalize">{l.cultivo?.tipo?.toLowerCase()}</p>
                    </div>
                    <span className="text-xs text-stone-500">{format(new Date(l.fecha), "d MMM", { locale: es })}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Movimientos de potreros */}
          <Section icon={MapPin} title="Últimos movimientos de potreros">
            {movimientosRecientes.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-6">Sin movimientos registrados</p>
            ) : (
              <div className="space-y-1">
                {movimientosRecientes.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-stone-800">Lote: <strong>{m.lote?.nombre}</strong></p>
                      <p className="text-[11px] text-stone-400">→ {m.potrero?.nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-500">{format(new Date(m.fechaEntrada), "d MMM yy", { locale: es })}</p>
                      {m.fechaSalida
                        ? <Badge variant="secondary" className="text-[10px]">Finalizado</Badge>
                        : <Badge className="text-[10px] bg-green-100 text-green-800">Activo</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Nota PDF */}
        <p className="text-xs text-stone-400 text-center pb-2">
          El PDF incluye: portada, resumen ejecutivo, animales, historial médico, potreros, tareas, cultivos, inventario, peones y contraportada.
        </p>
      </div>
    </>
  );
}