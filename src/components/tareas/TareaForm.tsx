"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { tareaSchema, type TareaInput } from "@/lib/validations";

const CATEGORIAS = ["GENERAL","ANIMAL","POTRERO","CULTIVO","INFRAESTRUCTURA","VETERINARIA","ADMINISTRATIVA"];
const SUGERENCIAS = [
  "Revisar bebederos", "Revisar cercas", "Contar ganado", "Revisar animales enfermos",
  "Aplicar vacuna", "Aplicar desparasitante", "Comprar alimento", "Fertilizar cultivo",
  "Poda de café", "Limpieza de corrales", "Revisar pastos", "Fumigación de cultivos",
];

const CARGO_LABELS: Record<string, string> = {
  PEON: "Peón", ENCARGADO: "Encargado", VAQUERO: "Vaquero", OPERADOR: "Operador", OTRO: "Otro",
};

interface Props {
  fincaId: string;
  onSubmit: (data: TareaInput) => void;
  loading?: boolean;
  onCancel?: () => void;
  defaultValues?: Partial<TareaInput & { peonId?: string }>;
  editMode?: boolean;
}

export function TareaForm({ fincaId, onSubmit, loading, onCancel, defaultValues, editMode }: Props) {
  const [peones, setPeones] = useState<any[]>([]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<TareaInput>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      prioridad: "MEDIA",
      categoria: "GENERAL",
      recordatorio: true,
      fincaId,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (fincaId) setValue("fincaId", fincaId);
  }, [fincaId, setValue]);

  // Pre-fill peonId when editing
  useEffect(() => {
    if (defaultValues?.peonId) setValue("peonId", defaultValues.peonId);
  }, [defaultValues?.peonId, setValue]);

  // Cargar peones activos de la finca
  useEffect(() => {
    if (!fincaId) return;
    fetch(`/api/peones?fincaId=${fincaId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPeones(d.filter((p: any) => p.estado === "ACTIVO")); });
  }, [fincaId]);

  const prioridadActual = (defaultValues?.prioridad as string) ?? "MEDIA";
  const categoriaActual = (defaultValues?.categoria as string) ?? "GENERAL";
  const peonActual = defaultValues?.peonId ?? "NINGUNO";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Título de la tarea *</Label>
        <Input placeholder="Ej: Revisar bebederos del potrero norte" {...register("titulo")} />
        {errors.titulo && <p className="text-xs text-red-500">{errors.titulo.message}</p>}
        {!editMode && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {SUGERENCIAS.slice(0, 6).map((s) => (
              <button key={s} type="button" onClick={() => setValue("titulo", s)}
                className="text-xs bg-stone-100 hover:bg-finca-green-50 hover:text-finca-green-700 text-stone-600 px-2 py-1 rounded-full transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea placeholder="Detalles adicionales de la tarea..." rows={2} {...register("descripcion")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prioridad</Label>
          <Select key={`prio-${prioridadActual}`} defaultValue={prioridadActual} onValueChange={(v) => setValue("prioridad", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["BAJA","MEDIA","ALTA","URGENTE"].map(p => (
                <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select key={`cat-${categoriaActual}`} defaultValue={categoriaActual} onValueChange={(v) => setValue("categoria", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map(c => (
                <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {editMode && (
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            key={`estado-${defaultValues?.estado}`}
            defaultValue={(defaultValues as any)?.estado ?? "PENDIENTE"}
            onValueChange={(v) => setValue("estado" as any, v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["PENDIENTE","EN_PROCESO","COMPLETADA","CANCELADA"].map(e => (
                <SelectItem key={e} value={e}>{e.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha límite</Label>
          <Input type="date" {...register("fechaLimite")} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-finca-green-600" />
            Asignar a peón
          </Label>
          <Select
            key={`peon-${peonActual}`}
            defaultValue={peonActual}
            onValueChange={(v) => setValue("peonId", v === "NINGUNO" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={peones.length === 0 ? "Sin peones registrados" : "Sin asignar"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NINGUNO">— Sin asignar —</SelectItem>
              {peones.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  👷 {p.nombre} · {CARGO_LABELS[p.cargo] ?? p.cargo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <input type="hidden" {...register("fincaId")} />

      <div className="flex gap-3 pt-2">
        {onCancel && <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editMode ? "Guardar cambios" : "Crear tarea"}
        </Button>
      </div>
    </form>
  );
}
