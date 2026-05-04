"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Leaf, MapPin, Calendar, MoreVertical, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TIPO_CONFIG: Record<string, { emoji: string; color: string }> = {
  CAFE:    { emoji: "☕", color: "from-amber-700 to-yellow-600" },
  PLATANO: { emoji: "🍌", color: "from-yellow-400 to-lime-400" },
  YUCA:    { emoji: "🌿", color: "from-green-500 to-emerald-600" },
  MAIZ:    { emoji: "🌽", color: "from-yellow-400 to-orange-400" },
  PASTO:   { emoji: "🌾", color: "from-lime-400 to-green-500" },
  CANA:    { emoji: "🎋", color: "from-green-600 to-teal-500" },
  FRIJOL:  { emoji: "🫘", color: "from-red-600 to-brown-500" },
  TOMATE:  { emoji: "🍅", color: "from-red-400 to-rose-500" },
  PIPA:    { emoji: "🥥", color: "from-amber-500 to-yellow-400" },
  OTRO:    { emoji: "🌱", color: "from-emerald-400 to-teal-500" },
};

const ETAPA_LABELS: Record<string, string> = {
  PREPARACION:    "Preparación",
  SIEMBRA:        "Siembra",
  GERMINACION:    "Germinación",
  CRECIMIENTO:    "Crecimiento",
  FLORACION:      "Floración",
  FRUCTIFICACION: "Fructificación",
  COSECHA:        "Cosecha",
  POST_COSECHA:   "Post-cosecha",
};

const ESTADO_CONFIG: Record<string, { variant: any; label: string }> = {
  ACTIVO:     { variant: "default",     label: "Activo" },
  COSECHADO:  { variant: "info",        label: "Cosechado" },
  PERDIDO:    { variant: "destructive", label: "Perdido" },
  BARBECHO:   { variant: "secondary",   label: "Barbecho" },
};

interface Props {
  cultivo: any;
  onEdit?: (cultivo: any) => void;
  onDelete?: (id: string) => void;
}

export function CultivoCard({ cultivo, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const config = TIPO_CONFIG[cultivo.tipo] ?? TIPO_CONFIG.OTRO;
  const estado = ESTADO_CONFIG[cultivo.estado] ?? { variant: "secondary", label: cultivo.estado };

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-stone-100 shadow-card transition-all duration-200",
      "hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden relative"
    )}>
      {/* Gradient top strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${config.color}`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-stone-50 flex items-center justify-center text-2xl flex-shrink-0">
              {config.emoji}
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm capitalize">
                {cultivo.tipo.charAt(0) + cultivo.tipo.slice(1).toLowerCase()}
                {cultivo.variedad && (
                  <span className="text-stone-400 font-normal"> · {cultivo.variedad}</span>
                )}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-0.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{cultivo.parcela?.nombre ?? "Sin parcela"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={estado.variant}>{estado.label}</Badge>
            {(onEdit || onDelete) && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-stone-400" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-8 w-36 bg-white rounded-xl shadow-modal border border-stone-100 z-10 py-1">
                    {onEdit && (
                      <button
                        onClick={() => { setMenuOpen(false); onEdit(cultivo); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => { setMenuOpen(false); onDelete(cultivo.id); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Etapa progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-stone-500 font-medium">Etapa</span>
            <span className="text-[11px] text-stone-700 font-semibold">{ETAPA_LABELS[cultivo.etapa] ?? cultivo.etapa}</span>
          </div>
          <EtapaBar etapa={cultivo.etapa} />
        </div>

        {/* Info row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {cultivo.areaHectareas && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Leaf className="w-3 h-3 text-stone-400" />
              <span>{cultivo.areaHectareas} ha</span>
            </div>
          )}
          {cultivo.fechaSiembra && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>Sembrado {format(new Date(cultivo.fechaSiembra), "d MMM yy", { locale: es })}</span>
            </div>
          )}
          {cultivo.fechaCosecha && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500 col-span-2">
              <Calendar className="w-3 h-3 text-amber-500" />
              <span className="text-amber-600 font-medium">
                Cosecha: {format(new Date(cultivo.fechaCosecha), "d MMM yy", { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Últimas labores */}
        {cultivo.labores?.length > 0 && (
          <div className="border-t border-stone-50 pt-2.5">
            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide mb-1.5">Últimas labores</p>
            <div className="space-y-1">
              {cultivo.labores.slice(0, 2).map((labor: any) => (
                <div key={labor.id} className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-600 capitalize">
                    {labor.tipo.replace(/_/g, " ").toLowerCase()}
                    {labor.producto ? ` · ${labor.producto}` : ""}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {format(new Date(labor.fecha), "d MMM", { locale: es })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const ETAPAS = ["PREPARACION","SIEMBRA","GERMINACION","CRECIMIENTO","FLORACION","FRUCTIFICACION","COSECHA","POST_COSECHA"];
function EtapaBar({ etapa }: { etapa: string }) {
  const idx = ETAPAS.indexOf(etapa);
  const pct = idx < 0 ? 0 : Math.round(((idx + 1) / ETAPAS.length) * 100);
  return (
    <div className="w-full bg-stone-100 rounded-full h-1.5">
      <div
        className="h-1.5 rounded-full bg-gradient-to-r from-finca-green-500 to-emerald-400 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
