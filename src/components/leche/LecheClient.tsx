"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Droplets, Plus, Trash2, TrendingUp, Award, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, CheckCircle2, FlaskConical, Users,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────
interface Animal { id: string; codigo: string; nombre: string | null; tipo: string; }
interface Lote   { id: string; nombre: string; }
interface Finca  { id: string; nombre: string; }

interface RegistroLeche {
  id: string;
  fecha: string;
  litros: number;
  animalesOrdenados?: number | null;
  notas?: string | null;
  animal?: { id: string; codigo: string; nombre: string | null } | null;
  lote?:   { id: string; nombre: string } | null;
}

interface ResumenData {
  totalLitros: number;
  diasConRegistro: number;
  promedioDiario: number;
  tendencia: { fecha: string; litros: number }[];
  rankingAnimales: { id: string; codigo: string; nombre: string | null; litros: number; registros: number }[];
  resumenLotes: { id: string; nombre: string; litros: number; registros: number }[];
  totalRegistros: number;
}

interface Props {
  finca:    Finca;
  animales: Animal[];
  lotes:    Lote[];
}

// ── Helpers ──────────────────────────────────────────────────────────────
function mesLabel(year: number, month: number) {
  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${MESES[month - 1]} ${year}`;
}

function mesStr(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

// ── Main Component ────────────────────────────────────────────────────────
export function LecheClient({ finca, animales, lotes }: Props) {
  const qc = useQueryClient();

  // Mes seleccionado
  const now = new Date();
  const [mesYear,  setMesYear]  = useState(now.getFullYear());
  const [mesMonth, setMesMonth] = useState(now.getMonth() + 1);

  // Form state
  const [showForm,   setShowForm]   = useState(false);
  const [tipoEntrada, setTipoEntrada] = useState<"INDIVIDUAL" | "LOTE">("INDIVIDUAL");
  const [form, setForm] = useState({
    fecha:             hoy(),
    litros:            "",
    animalesOrdenados: "",
    notas:             "",
    animalId:          "",
    loteId:            "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMsg,  setToastMsg]  = useState<string | null>(null);

  const mes = mesStr(mesYear, mesMonth);

  // ── Queries ────────────────────────────────────────────────────────────
  const resumenQuery = useQuery<ResumenData>({
    queryKey: ["leche-resumen", finca.id, mes],
    queryFn: async () => {
      const r = await fetch(`/api/leche/resumen?fincaId=${finca.id}&mes=${mes}`);
      if (!r.ok) throw new Error("Error al cargar resumen");
      return r.json();
    },
  });

  const registrosQuery = useQuery<RegistroLeche[]>({
    queryKey: ["leche-registros", finca.id, mes],
    queryFn: async () => {
      const [y, m] = mes.split("-").map(Number);
      const desde  = new Date(y, m - 1, 1).toISOString();
      const hasta  = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
      const r = await fetch(`/api/leche?fincaId=${finca.id}&desde=${desde}&hasta=${hasta}`);
      if (!r.ok) throw new Error("Error al cargar registros");
      return r.json();
    },
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const crearMutation = useMutation({
    mutationFn: async (data: object) => {
      const r = await fetch("/api/leche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        let msg = "Error al guardar";
        try { const e = await r.json(); msg = e.error ?? msg; } catch {}
        throw new Error(msg);
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leche-resumen", finca.id, mes] });
      qc.invalidateQueries({ queryKey: ["leche-registros", finca.id, mes] });
      setShowForm(false);
      setForm({ fecha: hoy(), litros: "", animalesOrdenados: "", notas: "", animalId: "", loteId: "" });
      setFormError(null);
      showToast("Registro guardado ✓");
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/leche/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Error al eliminar");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leche-resumen", finca.id, mes] });
      qc.invalidateQueries({ queryKey: ["leche-registros", finca.id, mes] });
      showToast("Registro eliminado");
    },
  });

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────
  function prevMes() {
    if (mesMonth === 1) { setMesYear(y => y - 1); setMesMonth(12); }
    else setMesMonth(m => m - 1);
  }
  function nextMes() {
    const esHoy = mesYear === now.getFullYear() && mesMonth === now.getMonth() + 1;
    if (esHoy) return;
    if (mesMonth === 12) { setMesYear(y => y + 1); setMesMonth(1); }
    else setMesMonth(m => m + 1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const litros = parseFloat(form.litros);
    if (isNaN(litros) || litros <= 0) { setFormError("Los litros deben ser un número positivo"); return; }

    const payload: any = {
      fincaId: finca.id,
      fecha:   new Date(form.fecha + "T12:00:00").toISOString(),
      litros,
      notas:   form.notas || undefined,
    };

    if (tipoEntrada === "INDIVIDUAL") {
      if (!form.animalId) { setFormError("Selecciona un animal"); return; }
      payload.animalId = form.animalId;
    } else {
      if (!form.loteId) { setFormError("Selecciona un lote"); return; }
      payload.loteId = form.loteId;
      if (form.animalesOrdenados) {
        payload.animalesOrdenados = parseInt(form.animalesOrdenados, 10);
      }
    }

    crearMutation.mutate(payload);
  }

  // ── Render ─────────────────────────────────────────────────────────────
  const resumen  = resumenQuery.data;
  const registros = registrosQuery.data ?? [];
  const loading   = resumenQuery.isLoading || registrosQuery.isLoading;
  const esMesActual = mesYear === now.getFullYear() && mesMonth === now.getMonth() + 1;

  // Formatear fechas de tendencia para mostrar solo DD/MM
  const tendenciaFmt = (resumen?.tendencia ?? []).map(d => ({
    ...d,
    fechaLabel: d.fecha.slice(5).replace("-", "/"),
  }));

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-finca-green-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4" /> {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Producción de Leche</h1>
            <p className="text-sm text-stone-500">{finca.nombre}</p>
          </div>
        </div>
        <Button
          onClick={() => { setShowForm(true); setFormError(null); }}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Registrar ordeño
        </Button>
      </div>

      {/* Selector de mes */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-stone-100 px-4 py-2.5 w-fit shadow-sm">
        <button onClick={prevMes} className="p-1 rounded-lg hover:bg-stone-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-stone-500" />
        </button>
        <span className="text-sm font-semibold text-stone-800 min-w-[140px] text-center">
          {mesLabel(mesYear, mesMonth)}
        </span>
        <button
          onClick={nextMes}
          disabled={esMesActual}
          className={cn("p-1 rounded-lg transition-colors", esMesActual ? "opacity-30 cursor-not-allowed" : "hover:bg-stone-100")}
        >
          <ChevronRight className="w-4 h-4 text-stone-500" />
        </button>
      </div>

      {/* Stats cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total del mes",     value: `${(resumen?.totalLitros ?? 0).toFixed(1)} L`,    color: "text-blue-600",   bg: "bg-blue-50" },
              { label: "Promedio diario",   value: `${(resumen?.promedioDiario ?? 0).toFixed(1)} L`, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Días registrados",  value: String(resumen?.diasConRegistro ?? 0),             color: "text-green-600",  bg: "bg-green-50" },
              { label: "Registros totales", value: String(resumen?.totalRegistros ?? 0),              color: "text-stone-600",  bg: "bg-stone-50" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm">
                <p className="text-xs text-stone-400 font-medium mb-1">{s.label}</p>
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Gráfica de tendencia */}
          {tendenciaFmt.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-stone-700">Tendencia del mes</h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={tendenciaFmt}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="fechaLabel" tick={{ fontSize: 11 }} stroke="#d1d5db" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#d1d5db" unit=" L" width={45} />
                  <Tooltip
                    formatter={(v: any) => [`${Number(v ?? 0).toFixed(1)} L`, "Litros"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
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
              </ResponsiveContainer>
            </div>
          )}

          {/* Ranking animales + Resumen lotes */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Ranking por animal */}
            {(resumen?.rankingAnimales ?? []).length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-semibold text-stone-700">Top animales del mes</h2>
                </div>
                <div className="space-y-2">
                  {resumen!.rankingAnimales.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-3">
                      <span className={cn(
                        "w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0",
                        i === 0 ? "bg-amber-100 text-amber-700" :
                        i === 1 ? "bg-stone-100 text-stone-600" :
                        i === 2 ? "bg-orange-100 text-orange-600" : "bg-stone-50 text-stone-400"
                      )}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">
                          {a.nombre ?? a.codigo}
                        </p>
                        <p className="text-[11px] text-stone-400">{a.registros} registros</p>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {a.litros.toFixed(1)} L
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen por lote */}
            {(resumen?.resumenLotes ?? []).length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-semibold text-stone-700">Producción por lote</h2>
                </div>
                <div className="space-y-2">
                  {resumen!.resumenLotes.map(l => (
                    <div key={l.id} className="flex items-center justify-between py-1.5 border-b border-stone-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-stone-800">{l.nombre}</p>
                        <p className="text-[11px] text-stone-400">{l.registros} registros</p>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">{l.litros.toFixed(1)} L</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tabla de registros */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-50">
              <h2 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-500" />
                Registros del mes ({registros.length})
              </h2>
            </div>
            {registros.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Droplets className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay registros este mes</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 text-xs text-stone-400 uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-3">Fecha</th>
                      <th className="text-left px-5 py-3">Animal / Lote</th>
                      <th className="text-right px-5 py-3">Litros</th>
                      <th className="text-right px-5 py-3">Animales</th>
                      <th className="text-left px-5 py-3">Notas</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {registros.map(r => (
                      <tr key={r.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-5 py-3 text-stone-600 whitespace-nowrap">
                          {new Date(r.fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "short" })}
                        </td>
                        <td className="px-5 py-3">
                          {r.animal ? (
                            <div>
                              <p className="font-medium text-stone-800">{r.animal.nombre ?? r.animal.codigo}</p>
                              <Badge variant="outline" className="text-[10px] mt-0.5">Individual</Badge>
                            </div>
                          ) : r.lote ? (
                            <div>
                              <p className="font-medium text-stone-800">{r.lote.nombre}</p>
                              <Badge variant="outline" className="text-[10px] mt-0.5 text-indigo-600 border-indigo-200">Lote</Badge>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-blue-600">
                          {r.litros.toFixed(1)} L
                        </td>
                        <td className="px-5 py-3 text-right text-stone-500">
                          {r.animalesOrdenados ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-stone-400 text-xs max-w-[150px] truncate">
                          {r.notas ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => { if (confirm("¿Eliminar este registro?")) eliminarMutation.mutate(r.id); }}
                            className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                Registrar ordeño
              </h2>
              <button
                onClick={() => { setShowForm(false); setFormError(null); }}
                className="w-7 h-7 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 flex items-center justify-center transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de entrada */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Tipo de registro</label>
                <div className="flex gap-2 mt-1.5">
                  {(["INDIVIDUAL", "LOTE"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setTipoEntrada(t); setForm(f => ({ ...f, animalId: "", loteId: "" })); }}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-sm font-medium border transition-all",
                        tipoEntrada === t
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-stone-500 border-stone-200 hover:border-blue-300"
                      )}
                    >
                      {t === "INDIVIDUAL" ? "🐄 Animal individual" : "🐄🐄 Por lote"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector animal o lote */}
              {tipoEntrada === "INDIVIDUAL" ? (
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Animal</label>
                  <select
                    className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.animalId}
                    onChange={e => setForm(f => ({ ...f, animalId: e.target.value }))}
                    required
                  >
                    <option value="">Selecciona un animal</option>
                    {animales.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.codigo}{a.nombre ? ` — ${a.nombre}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Lote</label>
                    <select
                      className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={form.loteId}
                      onChange={e => setForm(f => ({ ...f, loteId: e.target.value }))}
                      required
                    >
                      <option value="">Selecciona un lote</option>
                      {lotes.map(l => (
                        <option key={l.id} value={l.id}>{l.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                      Animales ordeñados <span className="text-stone-300 normal-case">(opcional)</span>
                    </label>
                    <input
                      type="number" min="1" step="1"
                      className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder="Ej: 12"
                      value={form.animalesOrdenados}
                      onChange={e => setForm(f => ({ ...f, animalesOrdenados: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {/* Fecha */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Fecha</label>
                <input
                  type="date"
                  className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.fecha}
                  max={hoy()}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  required
                />
              </div>

              {/* Litros */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Litros</label>
                <input
                  type="number" min="0.1" step="0.1"
                  className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Ej: 18.5"
                  value={form.litros}
                  onChange={e => setForm(f => ({ ...f, litros: e.target.value }))}
                  required
                />
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Notas <span className="text-stone-300 normal-case">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Observaciones del ordeño..."
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                />
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowForm(false); setFormError(null); }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={crearMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {crearMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
