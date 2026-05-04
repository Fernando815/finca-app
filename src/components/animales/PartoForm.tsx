"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  fecha:          z.string().min(1, "Fecha requerida"),
  tipoParto:      z.string().optional(),
  crias:          z.coerce.number().int().min(1).default(1),
  sexoCria:       z.string().optional(),
  pesoAlNacer:    z.coerce.number().positive().optional(),
  estadoCria:     z.string().optional(),
  complicaciones: z.string().optional(),
  proximoParto:   z.string().optional(),
  notas:          z.string().optional(),
  // Registro automático de la cría
  codigoCria:     z.string().optional(),
  nombreCria:     z.string().optional(),
  razaCria:       z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: any) => void;
  loading?: boolean;
  onCancel?: () => void;
  razaMadre?: string;
}

export function PartoForm({ onSubmit, loading, onCancel, razaMadre }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha:    new Date().toISOString().split("T")[0],
      crias:    1,
      razaCria: razaMadre ?? "",
    },
  });

  const crias      = watch("crias");
  const estadoCria = watch("estadoCria");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Datos del parto ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha del parto *</Label>
          <Input type="date" {...register("fecha")} />
          {errors.fecha && <p className="text-xs text-red-500">{errors.fecha.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Tipo de parto</Label>
          <Select onValueChange={(v) => setValue("tipoParto", v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="CESAREA">Cesárea</SelectItem>
              <SelectItem value="ASISTIDO">Asistido</SelectItem>
              <SelectItem value="COMPLICADO">Complicado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>N° de crías</Label>
          <Input type="number" min="1" max="5" {...register("crias")} />
        </div>
        <div className="space-y-2">
          <Label>Sexo de la cría</Label>
          <Select onValueChange={(v) => setValue("sexoCria", v)}>
            <SelectTrigger><SelectValue placeholder="Sexo..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MACHO">🐂 Macho</SelectItem>
              <SelectItem value="HEMBRA">🐄 Hembra</SelectItem>
              <SelectItem value="MIXTO">Mixto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Peso al nacer (kg)</Label>
          <Input type="number" min="0" step="0.1" placeholder="0.0" {...register("pesoAlNacer")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estado de la cría</Label>
          <Select onValueChange={(v) => setValue("estadoCria", v)}>
            <SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="VIVO">✅ Vivo y sano</SelectItem>
              <SelectItem value="DEBIL">⚠️ Débil / requiere cuidado</SelectItem>
              <SelectItem value="MUERTO">❌ Nacido muerto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Próximo parto estimado</Label>
          <Input type="date" {...register("proximoParto")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Complicaciones</Label>
        <Input placeholder="Ej: distocia, hemorragia, retención de placenta..." {...register("complicaciones")} />
      </div>

      {/* ── Registro de la cría como nuevo animal ── */}
      {estadoCria !== "MUERTO" && (
        <div className="rounded-2xl border-2 border-dashed border-finca-green-200 bg-finca-green-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <PawPrint className="w-4 h-4 text-finca-green-600" />
            <p className="text-sm font-semibold text-finca-green-800">
              Registrar cría{(crias ?? 1) > 1 ? `s (${crias})` : ""} como nuevo animal
            </p>
          </div>
          <p className="text-xs text-finca-green-600">
            Ingresa el código de identificación y la cría quedará registrada automáticamente con esta madre.
            {(crias ?? 1) > 1 && " Se añadirán sufijos -A, -B, etc. para cada cría."}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Código / Arete *</Label>
              <Input placeholder={`Ej: T${new Date().getFullYear().toString().slice(-2)}01`} {...register("codigoCria")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre (opcional)</Label>
              <Input placeholder="Nombre de la cría" {...register("nombreCria")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Raza</Label>
            <Input placeholder="Raza de la cría" defaultValue={razaMadre} {...register("razaCria")} />
          </div>
          <p className="text-[11px] text-stone-400">
            💡 Si dejas el código vacío, la cría no se registrará como animal automáticamente.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Notas del parto</Label>
        <Textarea placeholder="Observaciones del parto..." rows={2} {...register("notas")} />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar parto"}
        </Button>
      </div>
    </form>
  );
}
