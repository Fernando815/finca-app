"use client";

import { useState } from "react";
import { Scale, Search, ChevronRight } from "lucide-react";
import { PesoPanel } from "./PesoPanel";
import { cn } from "@/lib/utils";

interface Animal {
  id: string;
  codigo: string;
  nombre: string | null;
  tipo: string;
  pesoEstimado: number | null;
}

interface Props {
  animales: Animal[];
  finca: { id: string; nombre: string };
}

const TIPO_EMOJI: Record<string, string> = {
  VACA: "🐄", TORO: "🐂", TERNERO: "🐮", TERNERA: "🐮",
  CABALLO: "🐴", YEGUA: "🐴", OVEJA: "🐑", CABRA: "🐐",
  CERDO: "🐷", OTRO: "🐾",
};

export function PesoPageClient({ animales, finca }: Props) {
  const [busqueda, setBusqueda]         = useState("");
  const [animalSel, setAnimalSel]       = useState<Animal | null>(null);

  const filtrados = animales.filter(a => {
    const q = busqueda.toLowerCase();
    return a.codigo.toLowerCase().includes(q) || (a.nombre ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-finca-green-100 rounded-2xl flex items-center justify-center">
          <Scale className="w-5 h-5 text-finca-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-900">Peso en Báscula</h1>
          <p className="text-sm text-stone-500">{finca.nombre}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-5">

        {/* Lista de animales */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-stone-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-finca-green-300"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
            {filtrados.length === 0 ? (
              <p className="text-center text-sm text-stone-400 py-8">Sin resultados</p>
            ) : filtrados.map(a => (
              <button
                key={a.id}
                onClick={() => setAnimalSel(a)}
                className={cn(
                  "w-full text-left flex items-center gap-3 px-4 py-3 border-b border-stone-50 transition-colors",
                  animalSel?.id === a.id
                    ? "bg-finca-green-50 border-l-2 border-l-finca-green-500"
                    : "hover:bg-stone-50"
                )}
              >
                <span className="text-xl">{TIPO_EMOJI[a.tipo] ?? "🐾"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">
                    {a.nombre ?? a.codigo}
                  </p>
                  <p className="text-xs text-stone-400">
                    {a.codigo}
                    {a.pesoEstimado ? ` · ${a.pesoEstimado.toFixed(0)} kg` : ""}
                  </p>
                </div>
                <ChevronRight className={cn("w-4 h-4 flex-shrink-0 transition-colors",
                  animalSel?.id === a.id ? "text-finca-green-500" : "text-stone-300")} />
              </button>
            ))}
          </div>
        </div>

        {/* Panel de peso */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          {animalSel ? (
            <PesoPanel
              animalId={animalSel.id}
              animalNombre={animalSel.nombre ?? animalSel.codigo}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-60 text-stone-400">
              <Scale className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Selecciona un animal para ver su historial de peso</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
