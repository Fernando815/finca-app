import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Syringe, Baby, Scale, Calendar } from "lucide-react";
import { cn, formatPeso, TIPO_ANIMAL_LABELS } from "@/lib/utils";

interface Props { animal: any; }

const ESTADO_CONFIG: Record<string, { emoji: string; variant: any; label: string }> = {
  ACTIVO:         { emoji: "🟢", variant: "default",     label: "Activo" },
  VENDIDO:        { emoji: "💰", variant: "secondary",   label: "Vendido" },
  ENFERMO:        { emoji: "🔴", variant: "destructive", label: "Enfermo" },
  MUERTO:         { emoji: "⬛", variant: "secondary",   label: "Muerto" },
  EN_TRATAMIENTO: { emoji: "💊", variant: "warning",     label: "En tratamiento" },
  PRENADA:        { emoji: "🐄", variant: "info",        label: "Preñada" },
  EN_CELO:        { emoji: "❤️", variant: "purple",      label: "En celo" },
  SECO:           { emoji: "🍂", variant: "secondary",   label: "Seco" },
};

const TIPO_ICON: Record<string, string> = {
  VACA: "🐄", TORO: "🐂", TERNERO: "🐮", TERNERA: "🐮",
  CABALLO: "🐴", YEGUA: "🐴", OVEJA: "🐑", CABRA: "🐐",
  CERDO: "🐷", OTRO: "🦴",
};

export function AnimalCard({ animal }: Props) {
  const estado = ESTADO_CONFIG[animal.estado] ?? { emoji: "❓", variant: "secondary", label: animal.estado };
  const tipoIcon = TIPO_ICON[animal.tipo] ?? "🐾";
  const isAlert = animal.estado === "ENFERMO" || animal.estado === "EN_TRATAMIENTO";

  return (
    <Link href={`/animales/${animal.id}`}>
      <div className={cn(
        "bg-white rounded-2xl border shadow-card transition-all duration-200",
        "hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer group overflow-hidden",
        isAlert ? "border-red-100" : "border-stone-100"
      )}>
        {/* Color strip top */}
        <div className={cn("h-1 w-full", {
          "bg-gradient-to-r from-green-400  to-emerald-500": animal.estado === "ACTIVO",
          "bg-gradient-to-r from-red-400    to-rose-500":    animal.estado === "ENFERMO",
          "bg-gradient-to-r from-amber-400  to-orange-500":  animal.estado === "EN_TRATAMIENTO",
          "bg-gradient-to-r from-blue-400   to-sky-500":     animal.estado === "PRENADA",
          "bg-gradient-to-r from-violet-400 to-purple-500":  animal.estado === "EN_CELO",
          "bg-gradient-to-r from-stone-300  to-stone-400":   ["VENDIDO","MUERTO","SECO"].includes(animal.estado),
        })} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
                isAlert ? "bg-red-50" : "bg-stone-50"
              )}>
                {tipoIcon}
              </div>
              <div>
                <p className="font-semibold text-stone-900 text-sm leading-none">
                  {animal.nombre ?? `Animal #${animal.codigo}`}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5 font-mono">
                  #{animal.codigo}
                </p>
              </div>
            </div>
            <Badge variant={estado.variant as any}>
              {estado.emoji} {estado.label}
            </Badge>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="w-4 h-4 bg-stone-100 rounded-md flex items-center justify-center text-[10px]">
                {tipoIcon}
              </span>
              <span className="truncate">{TIPO_ANIMAL_LABELS[animal.tipo] ?? animal.tipo}</span>
            </div>
            {animal.raza && (
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <span className="w-4 h-4 bg-stone-100 rounded-md flex items-center justify-center text-[10px]">🧬</span>
                <span className="truncate">{animal.raza}</span>
              </div>
            )}
            {animal.pesoEstimado && (
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <Scale className="w-3 h-3 text-stone-400" />
                <span>{formatPeso(animal.pesoEstimado)}</span>
              </div>
            )}
            {animal.edadMeses && (
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <Calendar className="w-3 h-3 text-stone-400" />
                <span>{animal.edadMeses} meses</span>
              </div>
            )}
          </div>

          {/* Lote tag */}
          {animal.lote && (
            <div className="flex items-center gap-1.5 bg-finca-green-50 text-finca-green-700 rounded-lg px-2.5 py-1 mb-3">
              <span className="text-[10px]">🌿</span>
              <span className="text-[11px] font-medium truncate">{animal.lote.nombre}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 pt-2.5 border-t border-stone-50">
            <div className="flex items-center gap-1 text-[11px] text-stone-400">
              <Syringe className="w-3 h-3" />
              <span>{animal._count?.historialMedico ?? 0} med.</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-stone-400">
              <Baby className="w-3 h-3" />
              <span>{animal._count?.partos ?? 0} partos</span>
            </div>
            <div className="ml-auto">
              <span className="text-[11px] text-finca-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Ver detalle →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

