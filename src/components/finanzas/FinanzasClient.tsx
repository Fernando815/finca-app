"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Plus, X, ChevronLeft, ChevronRight,
  Trash2, AlertCircle, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Animal { id: string; codigo: string; nombre?: string | null }
interface Finca  { id: string; nombre: string }
interface Transaccion {
  id: string; fecha: string; tipo: "INGRESO" | "EGRESO";
  categoria: string; monto: number; descripcion: string;
  notas?: string | null;
  animalId?: string | null; animalCodigo?: string | null; animalNombre?: string | null;
}
interface Resumen {
  mes: string; totalIngresos: number; totalEgresos: number; balance: number;
  byCategoria: Record<string, { monto: number; tipo: string }>;
  ultimos6Meses: { mes: string; ingresos: number; egresos: number }[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATS_INGRESO = ["VENTA_ANIMAL","VENTA_LECHE","VENTA_CULTIVO","SUBSIDIO","OTRO_INGRESO"];
const CATS_EGRESO  = ["VETERINARIO","ALIMENTACION","SALARIO","MANTENIMIENTO","COMBUSTIBLE","INSUMOS","IMPUESTOS","OTRO_EGRESO"];

const CAT_LABEL: Record<string,string> = {
  VENTA_ANIMAL:"Venta de animal", VENTA_LECHE:"Venta de leche", VENTA_CULTIVO:"Venta de cultivo",
  SUBSIDIO:"Subsidio", OTRO_INGRESO:"Otro ingreso",
  VETERINARIO:"Veterinario", ALIMENTACION:"Alimentación", SALARIO:"Salario",
  MANTENIMIENTO:"Mantenimiento", COMBUSTIBLE:"Combustible", INSUMOS:"Insumos",
  IMPUESTOS:"Impuestos", OTRO_EGRESO:"Otro egreso",
};

const COLORS_INGRESOS = ["#22c55e","#16a34a","#86efac","#4ade80","#15803d","#bbf7d0"];
const COLORS_EGRESOS  = ["#ef4444","#dc2626","#fca5a5","#f87171","#b91c1c","#fee2e2","#991b1b","#fecaca"];

function fmtMes(mes: string) {
  const [y, m] = mes.split("-");
  return new Date(parseInt(y), parseInt(m)-1, 1)
    .toLocaleDateString("es-CR", { month: "short", year: "2-digit" });
}
function fmtColones(n: number) {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(n);
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { finca: Finca; animales: Animal[] }

export function FinanzasClient({ finca, animales }: Props) {
  const qc = useQueryClient();
  const now = new Date();
  const [mes, setMes] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`);
  const [filtroTipo, setFiltroTipo] = useState<"TODOS"|"INGRESO"|"EGRESO">("TODOS");
  const [pieTab, setPieTab] = useState<"INGRESO"|"EGRESO">("INGRESO");
  const [showForm, setShowForm] = useState(false);
  const [delId, setDelId] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);

  // ── Navigation ──
  function prevMes() {
    const [y,m] = mes.split("-").map(Number);
    const d = new Date(y, m-2, 1);
    setMes(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
  }
  function nextMes() {
    const [y,m] = mes.split("-").map(Number);
    const d = new Date(y, m, 1);
    setMes(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
  }

  // ── Data fetching ──
  const { data: resumen, isLoading: loadingRes } = useQuery<Resumen>({
    queryKey: ["finanzas-resumen", mes],
    queryFn: () => fetch(`/api/finanzas/resumen?mes=${mes}`).then(r=>r.json()),
  });
  const { data: transacciones = [], isLoading: loadingTx } = useQuery<Transaccion[]>({
    queryKey: ["finanzas", mes],
    queryFn: () => fetch(`/api/finanzas?mes=${mes}`).then(r=>r.json()),
  });

  // ── Filtered list ──
  const lista = useMemo(()=>
    filtroTipo === "TODOS" ? transacciones : transacciones.filter(t=>t.tipo===filtroTipo),
    [transacciones, filtroTipo]
  );

  // ── Pie data ──
  const pieData = useMemo(()=>{
    if (!resumen) return [];
    return Object.entries(resumen.byCategoria)
      .filter(([,v]) => v.tipo === pieTab)
      .map(([k,v]) => ({ name: CAT_LABEL[k]??k, value: v.monto }));
  }, [resumen, pieTab]);

  // ── Delete ──
  const deleteMut = useMutation({
    mutationFn: (id: string) => fetch(`/api/finanzas/${id}`, { method: "DELETE" }).then(r=>r.json()),
    onSuccess: (_data, id) => {
      const t = transacciones.find(x=>x.id===id);
      qc.invalidateQueries({ queryKey: ["finanzas"] });
      qc.invalidateQueries({ queryKey: ["finanzas-resumen"] });
      setDelId(null);
      if (t?.categoria === "VENTA_ANIMAL") setSuccess("Transacción eliminada. Animal revertido a ACTIVO.");
      else setSuccess("Transacción eliminada.");
      setTimeout(()=>setSuccess(null), 4000);
    },
  });

  const mesLabel = new Date(parseInt(mes.split("-")[0]), parseInt(mes.split("-")[1])-1, 1)
    .toLocaleDateString("es-CR", { month: "long", year: "numeric" });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Finanzas</h1>
          <p className="text-sm text-stone-500">{finca.nombre}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-finca-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-finca-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva transacción
        </button>
      </div>

      {/* Toast */}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Month selector */}
      <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-2xl p-3 w-fit">
        <button onClick={prevMes} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-stone-600" />
        </button>
        <span className="text-sm font-semibold text-stone-700 capitalize min-w-[140px] text-center">{mesLabel}</span>
        <button onClick={nextMes} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-stone-600" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Ingresos" value={resumen?.totalIngresos ?? 0}
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          color="green" loading={loadingRes}
        />
        <StatCard
          label="Total Egresos" value={resumen?.totalEgresos ?? 0}
          icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          color="red" loading={loadingRes}
        />
        <StatCard
          label="Balance" value={resumen?.balance ?? 0}
          icon={<DollarSign className="w-5 h-5 text-stone-600" />}
          color={(resumen?.balance ?? 0) >= 0 ? "green" : "red"} loading={loadingRes}
          highlight
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bar chart: últimos 6 meses */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-stone-700 mb-4">Últimos 6 meses</p>
          {!resumen || resumen.ultimos6Meses.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-10">Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resumen.ultimos6Meses} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis dataKey="mes" tickFormatter={fmtMes} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => `₡${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={55} />
                <Tooltip formatter={(v: any) => fmtColones(Number(v ?? 0))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4,4,0,0]} maxBarSize={30} />
                <Bar dataKey="egresos"  name="Egresos"  fill="#ef4444" radius={[4,4,0,0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart: por categoría */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-stone-700">Por categoría</p>
            <div className="flex rounded-lg border border-stone-200 overflow-hidden">
              {(["INGRESO","EGRESO"] as const).map(t => (
                <button key={t} onClick={() => setPieTab(t)}
                  className={cn("px-3 py-1 text-xs font-medium transition-colors",
                    pieTab === t ? (t==="INGRESO" ? "bg-green-600 text-white" : "bg-red-500 text-white")
                                : "text-stone-500 hover:bg-stone-50"
                  )}>
                  {t==="INGRESO" ? "Ingresos" : "Egresos"}
                </button>
              ))}
            </div>
          </div>
          {pieData.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-10">Sin datos para este mes</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                     dataKey="value" nameKey="name"
                     label={({ name, percent }: {name?:string;percent?:number}) => `${name ?? ""} ${((percent??0)*100).toFixed(0)}%`}
                     labelLine={false}
                >
                  {pieData.map((_,i) => (
                    <Cell key={i} fill={pieTab==="INGRESO" ? COLORS_INGRESOS[i%COLORS_INGRESOS.length] : COLORS_EGRESOS[i%COLORS_EGRESOS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => fmtColones(Number(v ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-700">Transacciones del mes</p>
          <div className="flex rounded-lg border border-stone-200 overflow-hidden">
            {(["TODOS","INGRESO","EGRESO"] as const).map(t => (
              <button key={t} onClick={() => setFiltroTipo(t)}
                className={cn("px-3 py-1 text-xs font-medium transition-colors",
                  filtroTipo === t ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-50"
                )}>
                {t==="TODOS" ? "Todos" : t==="INGRESO" ? "Ingresos" : "Egresos"}
              </button>
            ))}
          </div>
        </div>
        {loadingTx ? (
          <div className="p-8 text-center text-sm text-stone-400">Cargando...</div>
        ) : lista.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-stone-400 text-sm">No hay transacciones este mes</p>
            <button onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-finca-green-600 font-semibold hover:underline">
              + Agregar primera transacción
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {lista.map(t => (
              <TransaccionRow key={t.id} t={t} onDelete={() => setDelId(t.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <NuevaTransaccionModal
          animales={animales}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["finanzas"] });
            qc.invalidateQueries({ queryKey: ["finanzas-resumen"] });
            setShowForm(false);
            setSuccess("Transacción guardada correctamente.");
            setTimeout(()=>setSuccess(null), 4000);
          }}
        />
      )}

      {/* Delete confirm */}
      {delId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <p className="font-semibold text-stone-800">¿Eliminar transacción?</p>
            </div>
            {transacciones.find(t=>t.id===delId)?.categoria === "VENTA_ANIMAL" && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                Esta es una venta de animal. Al eliminarla, el animal volverá al estado <strong>ACTIVO</strong>.
              </p>
            )}
            <p className="text-sm text-stone-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50">
                Cancelar
              </button>
              <button onClick={() => deleteMut.mutate(delId)}
                disabled={deleteMut.isPending}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deleteMut.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, loading, highlight }: {
  label: string; value: number; icon: React.ReactNode;
  color: "green" | "red"; loading?: boolean; highlight?: boolean;
}) {
  return (
    <div className={cn(
      "bg-white border rounded-2xl p-4",
      highlight ? "border-stone-300 shadow-sm" : "border-stone-200"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center",
          color === "green" ? "bg-green-50" : "bg-red-50")}>
          {icon}
        </div>
        <p className="text-xs text-stone-500 font-medium">{label}</p>
      </div>
      {loading ? (
        <div className="h-7 w-32 bg-stone-100 animate-pulse rounded" />
      ) : (
        <p className={cn("text-xl font-bold", color === "green" ? "text-green-700" : "text-red-600")}>
          {fmtColones(value)}
        </p>
      )}
    </div>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransaccionRow({ t, onDelete }: { t: Transaccion; onDelete: () => void }) {
  const isIngreso = t.tipo === "INGRESO";
  const fecha = new Date(t.fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "short" });
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors group">
      <div className={cn("w-1.5 h-8 rounded-full flex-shrink-0", isIngreso ? "bg-green-500" : "bg-red-400")} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate">{t.descripcion}</p>
        <p className="text-xs text-stone-400">{CAT_LABEL[t.categoria] ?? t.categoria} · {fecha}</p>
        {t.animalCodigo && (
          <p className="text-xs text-stone-400">Animal: {t.animalCodigo}{t.animalNombre ? ` – ${t.animalNombre}` : ""}</p>
        )}
      </div>
      <p className={cn("text-sm font-semibold tabular-nums flex-shrink-0",
        isIngreso ? "text-green-700" : "text-red-600")}>
        {isIngreso ? "+" : "-"}{fmtColones(Number(t.monto))}
      </p>
      <button onClick={onDelete}
        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Nueva Transacción Modal ──────────────────────────────────────────────────

function NuevaTransaccionModal({ animales, onClose, onSaved }: {
  animales: Animal[]; onClose: () => void; onSaved: () => void;
}) {
  const [tipo, setTipo] = useState<"INGRESO"|"EGRESO">("INGRESO");
  const [form, setForm] = useState({
    fecha:       new Date().toISOString().slice(0,10),
    categoria:   "VENTA_LECHE",
    monto:       "",
    descripcion: "",
    notas:       "",
    animalId:    "",
  });
  const [err, setErr] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);

  const cats = tipo === "INGRESO" ? CATS_INGRESO : CATS_EGRESO;
  const showAnimal = form.categoria === "VENTA_ANIMAL";

  function handleTipoChange(t: "INGRESO"|"EGRESO") {
    setTipo(t);
    setForm(f => ({ ...f, categoria: t==="INGRESO" ? "VENTA_LECHE" : "VETERINARIO", animalId: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.descripcion.trim()) return setErr("La descripción es obligatoria.");
    if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0) return setErr("Monto inválido.");
    if (showAnimal && !form.animalId) return setErr("Seleccione un animal para la venta.");
    setSaving(true);
    try {
      const r = await fetch("/api/finanzas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha:       form.fecha,
          tipo,
          categoria:   form.categoria,
          monto:       Number(form.monto),
          descripcion: form.descripcion.trim(),
          notas:       form.notas.trim() || null,
          animalId:    form.animalId || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) { setErr(data.error ?? "Error al guardar"); return; }
      onSaved();
    } catch { setErr("Error de conexión"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="text-base font-bold text-stone-900">Nueva transacción</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Tipo */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-1.5 block">Tipo</label>
            <div className="flex rounded-xl border border-stone-200 overflow-hidden">
              {(["INGRESO","EGRESO"] as const).map(t => (
                <button type="button" key={t} onClick={() => handleTipoChange(t)}
                  className={cn("flex-1 py-2 text-sm font-semibold transition-colors",
                    tipo===t ? (t==="INGRESO" ? "bg-green-600 text-white" : "bg-red-500 text-white")
                             : "text-stone-500 hover:bg-stone-50"
                  )}>
                  {t==="INGRESO" ? "💰 Ingreso" : "💸 Egreso"}
                </button>
              ))}
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-1.5 block">Categoría</label>
            <select value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value,animalId:""}))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-finca-green-400">
              {cats.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
            </select>
          </div>

          {/* Animal selector (solo VENTA_ANIMAL) */}
          {showAnimal && (
            <div>
              <label className="text-xs font-semibold text-stone-600 mb-1.5 block">Animal a vender</label>
              <select value={form.animalId} onChange={e=>setForm(f=>({...f,animalId:e.target.value}))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-finca-green-400">
                <option value="">-- Seleccione --</option>
                {animales.map(a => (
                  <option key={a.id} value={a.id}>{a.codigo}{a.nombre ? ` – ${a.nombre}` : ""}</option>
                ))}
              </select>
              <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-2.5 mt-2 border border-amber-200">
                ⚠️ Guardar marcará el animal como <strong>VENDIDO</strong> y dejará de aparecer en módulos operativos.
              </p>
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-1.5 block">Monto (₡ colones)</label>
            <input type="number" min="0" step="100" value={form.monto}
              onChange={e=>setForm(f=>({...f,monto:e.target.value}))}
              placeholder="0"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-finca-green-400"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-1.5 block">Descripción</label>
            <input type="text" value={form.descripcion}
              onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))}
              placeholder="Ej: Venta de 40L de leche a Dos Pinos"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-finca-green-400"
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-1.5 block">Fecha</label>
            <input type="date" value={form.fecha}
              onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-finca-green-400"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-1.5 block">Notas (opcional)</label>
            <textarea value={form.notas} rows={2}
              onChange={e=>setForm(f=>({...f,notas:e.target.value}))}
              placeholder="Información adicional..."
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-finca-green-400 resize-none"
            />
          </div>

          {err && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-finca-green-600 text-white text-sm font-semibold hover:bg-finca-green-700 disabled:opacity-50 transition-colors">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
