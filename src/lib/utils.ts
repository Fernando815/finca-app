import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFecha(date: Date | string, pattern = "dd/MM/yyyy") {
  return format(new Date(date), pattern, { locale: es });
}

export function formatFechaRelativa(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function diasEnPotrero(fechaEntrada: Date | string): number {
  return differenceInDays(new Date(), new Date(fechaEntrada));
}

/** Calcula días recomendados de ocupación según área y cantidad de animales */
export function calcularDiasOcupacion(
  areaHa: number,
  cantidadAnimales: number,
  tipoUso: "ENGORDE" | "CRIA" | "LECHE" | "MIXTO"
): number {
  // Carga animal base: 1 UA por hectárea en pasto natural, 2-3 en mejorado
  const cargaBase = tipoUso === "LECHE" ? 2.5 : tipoUso === "ENGORDE" ? 2 : 1.5;
  const capacidad = Math.round(areaHa * cargaBase);
  if (cantidadAnimales <= 0) return 7;
  // A mayor carga, menos días de ocupación
  const factor = capacidad / cantidadAnimales;
  const dias = Math.round(7 * factor);
  return Math.min(Math.max(dias, 3), 14); // entre 3 y 14 días
}

/** Calcula días de descanso recomendados */
export function calcularDiasDescanso(tipoUso: string): number {
  switch (tipoUso) {
    case "LECHE":  return 28;
    case "ENGORDE": return 35;
    case "CRIA":   return 21;
    default:       return 28;
  }
}

/** Estima fecha próximo parto (283 días desde último celo con resultado preñada) */
export function estimarProximoParto(fechaCelo: Date): Date {
  const d = new Date(fechaCelo);
  d.setDate(d.getDate() + 283);
  return d;
}

export function getEstadoColor(estado: string): string {
  const map: Record<string, string> = {
    ACTIVO:         "bg-green-100 text-green-800",
    VENDIDO:        "bg-blue-100 text-blue-800",
    ENFERMO:        "bg-red-100 text-red-800",
    MUERTO:         "bg-gray-100 text-gray-800",
    EN_TRATAMIENTO: "bg-yellow-100 text-yellow-800",
    PRENADA:        "bg-pink-100 text-pink-800",
    EN_CELO:        "bg-purple-100 text-purple-800",
    SECO:           "bg-orange-100 text-orange-800",
  };
  return map[estado] ?? "bg-gray-100 text-gray-800";
}

export function getPrioridadColor(prioridad: string): string {
  const map: Record<string, string> = {
    BAJA:    "bg-blue-100 text-blue-700 border-blue-200",
    MEDIA:   "bg-yellow-100 text-yellow-700 border-yellow-200",
    ALTA:    "bg-orange-100 text-orange-700 border-orange-200",
    URGENTE: "bg-red-100 text-red-700 border-red-200",
  };
  return map[prioridad] ?? "bg-gray-100 text-gray-700 border-gray-200";
}

export function formatPeso(peso: number | null | undefined): string {
  if (!peso) return "—";
  return `${peso.toLocaleString("es-CR")} kg`;
}

export function formatArea(area: number | null | undefined): string {
  if (!area) return "—";
  return `${area.toLocaleString("es-CR")} ha`;
}

export function capitalizarPrimera(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const TIPO_ANIMAL_LABELS: Record<string, string> = {
  VACA: "Vaca", TORO: "Toro", TERNERO: "Ternero", TERNERA: "Ternera",
  CABALLO: "Caballo", YEGUA: "Yegua", OVEJA: "Oveja", CABRA: "Cabra",
  CERDO: "Cerdo", OTRO: "Otro",
};

export const ENFOQUE_LABELS: Record<string, string> = {
  ENGORDE: "Engorde", CRIA: "Cría", LECHE: "Leche",
  AGRICULTURA: "Agricultura", MIXTA: "Mixta",
};

export const CULTIVO_LABELS: Record<string, string> = {
  CAFE: "Café", PLATANO: "Plátano", YUCA: "Yuca", MAIZ: "Maíz",
  PASTO: "Pasto", CANA: "Caña", FRIJOL: "Frijol", TOMATE: "Tomate",
  PIPA: "Pipa", OTRO: "Otro",
};
