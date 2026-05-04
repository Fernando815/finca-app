"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Scale, Plus, Trash2, TrendingUp, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────
export interface RegistroPeso {
  id: string;
  fecha: string;
  pesoKg: number;
  metodo: "BASCULA" | "ESTIMADO" | "CINTA";
  notas?: string | null;
  animal?: { id: string; codigo: string; nombre: string | null };
}

interface Props {
  animalId: string;
  animalNombre: string;
}

const METODO_LABEL: Record<string, string> = {
  BASCULA:  "Báscula",
  ESTIMADO: "Estimado",
  CINTA:    "Cinta",
};

const METODO_COLOR: Record<string, string> = {
  BASCULA:  "bg-blue-100 text-blue-700",
  ESTIMADO: "bg-yellow-100 text-yellow-700",
  CINTA:    "bg-purple-100 text-purple-700",
};

function hoy() { return new Date().toISOString().slice(0, 10); }

// ── Component ──────────────────────────────────────────────────────────────
export function PesoPanel({ animalId, animalNombre }: Props) {
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fecha: hoy(), pesoKg: "", metodo: "BASCULA", notas: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [rango, setRango] = useState<"30" | "90" | "ALL">("ALL");

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // ── Query ────────────────────────────────────────────────────────────────
  const { data: registros = [], isLoading } = useQuery<RegistroPeso[]>({
    queryKey: ["peso", animalId],
    queryFn: async () => {
      const r = await fetch(`/api/peso?animalId=${animalId}`);
      if (!r.ok) throw new Error("Error al cargar pesos");
      return r.json();
    },
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const crearMutation = useMutation({
    mutationFn: async (data: object) => {
      const r = await fetch("/api/peso", {
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
      qc.invalidateQueries({ queryKey: ["peso", animalId] });
      setShowForm(false);
      setForm({ fecha: hoy(), pesoKg: "", metodo: "BASCULA", notas: "" });
      setFormError(null);
      showToast("Peso registrado ✓");
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/peso/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Error al eliminar");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["peso", animalId] });
      showToast("Registro eliminado");
    },
  });

  // ── Computed ──────────────────────────────────────────────────────────────
  const ordenados = [...registros].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const filtrados = (() => {
    if (rango === "ALL") return ordenados;
    const dias = rango === "30" ? 30 : 90;
    const corte = new Date(Date.now() - dias * 86400000);
    return ordenados.filter(r => new Date(r.fecha) >= corte);
  })();

  const ultimo    = ordenados.at(-1);
  const penultimo = ordenados.at(-2);

  const deltaPeso = ultimo && penultimo ? ultimo.pesoKg - penultimo.pesoKg : null;
  const deltasDias = ultimo && penultimo
    ? Math.max(1, Math.round((new Date(ultimo.fecha).getTime() - new Date(penultimo.fecha).getTime()) / 86400000))
    : null;
  const kgPorDia = deltaPeso !== null && deltasDias !== null ? deltaPeso / deltasDias : null;

  const chartData = filtrados.map(r => ({
    fechaLabel: new Date(r.fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "short" }),
    pesoKg: r.pesoKg,
    metodo: r.metodo,
  }));

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const pesoKg = parseFloat(form.pesoKg);
    if (isNaN(pesoKg) || pesoKg <= 0) { setFormError("El peso debe ser un número positivo"); return; }
    crearMutation.mutate({
      animalId,
      fecha:  new Date(form.fecha + "T12:00:00").toISOString(),
      pesoKg,
      metodo: form.metodo,
      notas:  form.notas || undefined,
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-finca-green-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-stone-500" />
          <span className="text-sm font-semibold text-stone-700">Historial de peso</span>
          <span className="text-xs text-stone-400">({registros.length} registros)</span>
        </div>
        <Button
          size="sm"
          onClick={() => { setShowForm(true); setFormError(null); }}
          className="bg-finca-green-600 hover:bg-finca-green-700 text-white gap-1.5 h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Registrar peso
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
        </div>
      ) : registros.length === 0 ? (
        <div className="text-center py-10 text-stone-400">
          <Scale className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin registros de peso aún</p>
          <p className="text-xs mt-1">Haz clic en "Registrar peso" para comenzar</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-[11px] text-stone-400 mb-1">Peso actual</p>
              <p className="text-xl font-bold text-stone-800">{ultimo?.pesoKg.toFixed(1)} kg</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-[11px] text-stone-400 mb-1">Vs registro anterior</p>
              <p className={cn("text-xl font-bold", deltaPeso === null ? "text-stone-400" : deltaPeso >= 0 ? "text-green-600" : "text-red-500")}>
                {deltaPeso === null ? "—" : `${deltaPeso >= 0 ? "+" : ""}${deltaPeso.toFixed(1)} kg`}
              </p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-[11px] text-stone-400 mb-1">Ganancia/día</p>
              <p className={cn("text-xl font-bold", kgPorDia === null ? "text-stone-400" : kgPorDia >= 0 ? "text-green-600" : "text-red-500")}>
                {kgPorDia === null ? "—" : `${kgPorDia >= 0 ? "+" : ""}${kgPorDia.toFixed(2)} kg`}
              </p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-[11px] text-stone-400 mb-1">Último pesaje</p>
              <p className="text-sm font-semibold text-stone-700">
                {ultimo ? new Date(ultimo.fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>

          {/* Gráfica */}
          {filtrados.length > 1 && (
            <div className="bg-white rounded-xl border border-stone-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-finca-green-500" />
                  <span className="text-xs font-semibold text-stone-600">Curva de crecimiento</span>
                </div>
                <div className="flex gap-1">
                  {(["30", "90", "ALL"] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setRango(r)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors",
                        rango === r ? "bg-finca-green-600 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      )}
                    >
                      {r === "ALL" ? "Todo" : `${r}d`}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="fechaLabel" tick={{ fontSize: 10 }} stroke="#d1d5db" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#d1d5db" unit=" kg" width={50} />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)} kg`, "Peso"]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pesoKg"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#16a34a" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabla */}
          <div className="overflow-x-auto rounded-xl border border-stone-100">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs text-stone-400 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5">Fecha</th>
                  <th className="text-right px-4 py-2.5">Peso</th>
                  <th className="text-right px-4 py-2.5">Δ</th>
                  <th className="text-left px-4 py-2.5">Método</th>
                  <th className="text-left px-4 py-2.5">Notas</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {[...ordenados].reverse().map((r, i, arr) => {
                  const prev = arr[i + 1];
                  const delta = prev ? r.pesoKg - prev.pesoKg : null;
                  return (
                    <tr key={r.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">
                        {new Date(r.fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-stone-800">
                        {r.pesoKg.toFixed(1)} kg
                      </td>
                      <td className={cn("px-4 py-2.5 text-right text-xs font-medium", delta === null ? "text-stone-300" : delta >= 0 ? "text-green-600" : "text-red-500")}>
                        {delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", METODO_COLOR[r.metodo])}>
                          {METODO_LABEL[r.metodo]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-stone-400 text-xs max-w-[140px] truncate">
                        {r.notas ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => { if (confirm("¿Eliminar este registro?")) eliminarMutation.mutate(r.id); }}
                          className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-finca-green-600" />
                Registrar peso — {animalNombre}
              </h2>
              <button
                onClick={() => { setShowForm(false); setFormError(null); }}
                className="w-7 h-7 rounded-lg text-stone-400 hover:bg-stone-100 flex items-center justify-center text-lg leading-none"
              >×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Fecha */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Fecha</label>
                <input
                  type="date"
                  max={hoy()}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-finca-green-300"
                  value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  required
                />
              </div>

              {/* Peso */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Peso (kg)</label>
                <input
                  type="number" min="1" step="0.1"
                  placeholder="Ej: 350.5"
                  className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-finca-green-300"
                  value={form.pesoKg}
                  onChange={e => setForm(f => ({ ...f, pesoKg: e.target.value }))}
                  required
                />
              </div>

              {/* Método */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Método</label>
                <div className="flex gap-2 mt-1.5">
                  {(["BASCULA", "ESTIMADO", "CINTA"] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, metodo: m }))}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-medium border transition-all",
                        form.metodo === m
                          ? "bg-finca-green-600 text-white border-finca-green-600"
                          : "bg-white text-stone-500 border-stone-200 hover:border-finca-green-300"
                      )}
                    >
                      {METODO_LABEL[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Notas <span className="text-stone-300 normal-case">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-finca-green-300"
                  placeholder="Condición corporal, observaciones..."
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1"
                  onClick={() => { setShowForm(false); setFormError(null); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={crearMutation.isPending}
                  className="flex-1 bg-finca-green-600 hover:bg-finca-green-700 text-white">
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
