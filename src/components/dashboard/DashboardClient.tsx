"use client";
import {
  Beef, CheckSquare, AlertTriangle, Sprout, ArrowRight,
  Clock, Syringe, TrendingUp, RefreshCw, Flame, Droplets, Grid3X3,
} from "lucide-react";
import { cn, formatFecha, diasEnPotrero } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";

interface Props { data: any; }

/* ── Tarjeta de estadística con gradiente ── */
function StatCard({
  label, value, icon: Icon, gradient, iconColor, href, suffix = "",
}: {
  label: string; value: number | string; icon: any;
  gradient: string; iconColor: string; href: string; suffix?: string;
}) {
  return (
    <Link href={href}>
      <div className={cn(
        "rounded-2xl border p-4 transition-all duration-200",
        "hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer",
        gradient
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", iconColor)}>
            <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          </div>
          <TrendingUp className="w-3.5 h-3.5 text-stone-300" />
        </div>
        <p className="text-2xl font-bold text-stone-800 leading-none">
          {value}<span className="text-sm font-normal text-stone-400 ml-1">{suffix}</span>
        </p>
        <p className="text-xs text-stone-500 mt-1 font-medium">{label}</p>
      </div>
    </Link>
  );
}

/* ── Fila de alerta ── */
function AlertRow({ icon, text, href, colorClass }: {
  icon: string; text: React.ReactNode; href: string; colorClass: string;
}) {
  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-sm",
      colorClass
    )}>
      <span className="text-base leading-none">{icon}</span>
      <span className="text-sm flex-1 text-stone-700">{text}</span>
      <ArrowRight className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
    </Link>
  );
}

/* ── Badge de prioridad ── */
function PrioridadBadge({ p }: { p: string }) {
  const map: Record<string, { label: string; variant: any }> = {
    BAJA:    { label: "Baja",    variant: "info" },
    MEDIA:   { label: "Media",   variant: "warning" },
    ALTA:    { label: "Alta",    variant: "destructive" },
    URGENTE: { label: "Urgente", variant: "destructive" },
  };
  const cfg = map[p] ?? { label: p, variant: "secondary" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function DashboardClient({ data }: Props) {
  const { stats, tareasHoy, lotesAMover, proximasVacunas, finca, charts } = data;
  const hayAlertas = stats.animalesEnfermos > 0 || lotesAMover.length > 0;

  return (
    <div className="space-y-6 max-w-5xl animate-stagger">

      {/* ── Bienvenida ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-800">
            Buenas, <span className="text-gradient-green">{finca?.nombre ?? "tu finca"}</span> 🌿
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {new Date().toLocaleDateString("es-CR", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/tareas/new">
            + Nueva tarea
          </Link>
        </Button>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Animales activos"
          value={stats.totalAnimales}
          icon={Beef}
          gradient="stat-green"
          iconColor="bg-green-100 text-green-700"
          href="/animales"
        />
        <StatCard
          label="En tratamiento"
          value={stats.animalesEnTratamiento}
          icon={Flame}
          gradient="stat-amber"
          iconColor="bg-amber-100 text-amber-700"
          href="/animales?filtro=EN_TRATAMIENTO"
        />
        <StatCard
          label="Tareas vencidas"
          value={stats.tareasVencidas}
          icon={CheckSquare}
          gradient="stat-red"
          iconColor="bg-red-100 text-red-600"
          href="/tareas?filtro=VENCIDA"
        />
        <StatCard
          label="Cultivos activos"
          value={stats.cultivosActivos}
          icon={Sprout}
          gradient="stat-blue"
          iconColor="bg-blue-100 text-blue-700"
          href="/cultivos"
        />
      </div>

      {/* ── Alertas críticas ───────────────────────────── */}
      {hayAlertas && (
        <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold text-red-800">
              Requieren atención ({stats.animalesEnfermos + lotesAMover.length})
            </h3>
          </div>
          <div className="space-y-2">
            {stats.animalesEnfermos > 0 && (
              <AlertRow
                icon="🐄"
                text={<><strong>{stats.animalesEnfermos} animal(es)</strong> enfermo(s) — revisar urgente</>}
                href="/animales?filtro=ENFERMO"
                colorClass="bg-white border-red-100 hover:border-red-200"
              />
            )}
            {lotesAMover.map((mov: any) => {
              const dias = diasEnPotrero(mov.fechaEntrada);
              return (
                <AlertRow
                  key={mov.id}
                  icon="🌿"
                  text={<>Lote <strong>{mov.lote.nombre}</strong> lleva <strong>{dias} días</strong> en {mov.potrero.nombre}</>}
                  href="/potreros"
                  colorClass="bg-white border-amber-100 hover:border-amber-200"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Dos columnas ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Tareas de hoy */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-finca-green-50 rounded-lg flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-finca-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-800 leading-none">Tareas de hoy</h3>
                <p className="text-[10px] text-stone-400">{tareasHoy.length} pendientes</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-finca-green-600" asChild>
              <Link href="/tareas">Ver todas <ArrowRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </div>

          {tareasHoy.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-stone-600">¡Sin tareas pendientes!</p>
              <p className="text-xs text-stone-400 mt-0.5">Buen trabajo 🎉</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {tareasHoy.slice(0, 5).map((tarea: any) => (
                <div key={tarea.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group">
                  <div className={cn("w-1.5 h-8 rounded-full flex-shrink-0", {
                    "bg-stone-200":   tarea.prioridad === "BAJA",
                    "bg-amber-400":   tarea.prioridad === "MEDIA",
                    "bg-orange-500":  tarea.prioridad === "ALTA",
                    "bg-red-500":     tarea.prioridad === "URGENTE",
                  })} />
                  <span className="text-sm text-stone-700 flex-1 truncate">{tarea.titulo}</span>
                  <PrioridadBadge p={tarea.prioridad} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximas vacunas */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <Syringe className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-800 leading-none">Próximas vacunas</h3>
                <p className="text-[10px] text-stone-400">Próximos 7 días</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-blue-600" asChild>
              <Link href="/animales">Ver animales <ArrowRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </div>

          {proximasVacunas.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Syringe className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm font-medium text-stone-600">Sin vacunas esta semana</p>
              <p className="text-xs text-stone-400 mt-0.5">Todo al día ✓</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {proximasVacunas.map((h: any) => (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/60 border border-blue-50 hover:bg-blue-50 transition-colors">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Syringe className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-stone-800 truncate">{h.producto}</p>
                    <p className="text-[11px] text-stone-400">{h.animal.nombre ?? h.animal.codigo}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] font-semibold text-blue-700">{formatFecha(h.proximaFecha)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Acciones rápidas ───────────────────────────── */}
      <div className="bg-gradient-to-r from-finca-green-600 to-finca-green-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-sm">Acciones rápidas</h3>
            <p className="text-xs text-green-200 mt-0.5">¿Qué quieres registrar hoy?</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Registrar animal",  href: "/animales?nuevo=1",  icon: "🐄" },
              { label: "Mover lote",         href: "/potreros",           icon: "🌿" },
              { label: "Nueva tarea",        href: "/tareas?nuevo=1",     icon: "✅" },
              { label: "Labor agrícola",     href: "/cultivos?nuevo=1",   icon: "🌱" },
            ].map(a => (
              <Link key={a.href} href={a.href}>
                <div className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors px-3 py-1.5 rounded-xl text-xs font-medium border border-white/20">
                  <span>{a.icon}</span> {a.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Gráficas ───────────────────────────────────── */}
      <ChartsSection charts={charts} />

    </div>
  );
}

// ── Colores para gráficas ──────────────────────────────────────────────────
const TIPO_COLORS: Record<string, string> = {
  VACA:    "#16a34a", TORO:    "#15803d", TERNERO: "#4ade80",
  TERNERA: "#86efac", CABALLO: "#d97706", YEGUA:   "#f59e0b",
  OVEJA:   "#60a5fa", CABRA:   "#818cf8", CERDO:   "#f87171", OTRO: "#a8a29e",
};
const ESTADO_TAREA_COLORS: Record<string, string> = {
  PENDIENTE:  "#fbbf24",
  EN_PROCESO: "#60a5fa",
  COMPLETADA: "#4ade80",
  VENCIDA:    "#f87171",
  CANCELADA:  "#d1d5db",
};
const ESTADO_TAREA_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente", EN_PROCESO: "En proceso",
  COMPLETADA: "Completada", VENCIDA: "Vencida", CANCELADA: "Cancelada",
};

function ChartsSection({ charts }: { charts: any }) {
  if (!charts) return null;

  const { animalesPorTipo, tareasPorEstado, lecheChart, potreros } = charts;

  const hayAnimales = animalesPorTipo?.length > 0;
  const hayTareas   = tareasPorEstado?.length > 0;
  const hayLeche    = lecheChart?.length > 0;

  if (!hayAnimales && !hayTareas && !hayLeche) return null;

  const tareasData = tareasPorEstado?.map((t: any) => ({
    ...t,
    label: ESTADO_TAREA_LABELS[t.estado] ?? t.estado,
    color: ESTADO_TAREA_COLORS[t.estado] ?? "#a8a29e",
  }));

  const potrerosData = [
    { name: "Disponibles", value: potreros?.disponibles ?? 0, color: "#4ade80" },
    { name: "Ocupados",    value: potreros?.ocupados    ?? 0, color: "#fb923c" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">
        Resumen visual
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Donut: Composición del hato */}
        {hayAnimales && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                <Beef className="w-3.5 h-3.5 text-green-600" />
              </div>
              <h4 className="text-sm font-semibold text-stone-700">Composición del hato</h4>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={animalesPorTipo}
                  dataKey="total"
                  nameKey="tipo"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {animalesPorTipo.map((entry: any) => (
                    <Cell key={entry.tipo} fill={TIPO_COLORS[entry.tipo] ?? "#a8a29e"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: unknown, name: unknown) => [v, name]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 11 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 11, color: "#78716c" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Barras: Tareas por estado */}
        {hayTareas && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h4 className="text-sm font-semibold text-stone-700">Tareas por estado</h4>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={tareasData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#d1d5db" />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  stroke="#d1d5db"
                  width={68}
                />
                <Tooltip
                  formatter={(v: unknown) => [v, "tareas"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 11 }}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {tareasData.map((entry: any) => (
                    <Cell key={entry.estado} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Línea: Leche últimos 7 días */}
        {hayLeche && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-stone-700">Leche — últimos 7 días</h4>
                  <p className="text-[10px] text-stone-400">
                    Total: {lecheChart.reduce((s: number, d: any) => s + d.litros, 0).toFixed(1)} L
                  </p>
                </div>
              </div>
              <Link href="/leche" className="text-[11px] text-blue-500 hover:underline">Ver más →</Link>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              {lecheChart.length === 1 ? (
                <BarChart data={lecheChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="fechaLabel" tick={{ fontSize: 10 }} stroke="#d1d5db" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#d1d5db" unit=" L" width={40} />
                  <Tooltip
                    formatter={(v: unknown) => [`${(v as number).toFixed(1)} L`, "Litros"]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 11 }}
                  />
                  <Bar dataKey="litros" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={lecheChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="fechaLabel" tick={{ fontSize: 10 }} stroke="#d1d5db" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#d1d5db" unit=" L" width={40} />
                  <Tooltip
                    formatter={(v: unknown) => [`${(v as number).toFixed(1)} L`, "Litros"]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="litros"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#3b82f6" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Donut: Potreros */}
        {potrerosData.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                <Grid3X3 className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <h4 className="text-sm font-semibold text-stone-700">Estado de potreros</h4>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={potrerosData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={3}
                >
                  {potrerosData.map((entry: any) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: unknown, name: unknown) => [v, name]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 11 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 11, color: "#78716c" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </div>
  );
}

