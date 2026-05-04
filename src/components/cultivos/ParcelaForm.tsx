"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const schema = z.object({
  nombre:        z.string().min(1, "Nombre requerido"),
  numero:        z.coerce.number().int().positive().optional(),
  areaHectareas: z.coerce.number().positive().optional(),
  tipo:          z.enum(["CULTIVO","PASTO","BOSQUE","INFRAESTRUCTURA","OTRO"]).default("CULTIVO"),
  notas:         z.string().optional(),
  fincaId:       z.string(),
});

type ParcelaInput = z.infer<typeof schema>;

const TIPOS = [
  { value: "CULTIVO",         label: "🌱 Cultivo" },
  { value: "PASTO",           label: "🌾 Pasto / Potrero" },
  { value: "BOSQUE",          label: "🌳 Bosque / Rastrojo" },
  { value: "INFRAESTRUCTURA", label: "🏚️ Infraestructura" },
  { value: "OTRO",            label: "📍 Otro" },
];

interface Props {
  fincaId: string;
  onSubmit: (data: ParcelaInput) => void;
  loading?: boolean;
  onCancel?: () => void;
}

export function ParcelaForm({ fincaId, onSubmit, loading, onCancel }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ParcelaInput>({
    resolver: zodResolver(schema),
    defaultValues: { fincaId, tipo: "CULTIVO" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("fincaId")} value={fincaId} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label>Nombre de la parcela *</Label>
          <Input placeholder="Ej: Parcela Norte, Lote 3..." {...register("nombre")} />
          {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Número <span className="text-stone-400 text-xs">(opcional)</span></Label>
          <Input type="number" min="1" placeholder="1" {...register("numero")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de parcela</Label>
          <Select defaultValue="CULTIVO" onValueChange={(v) => setValue("tipo", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPOS.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Área (hectáreas)</Label>
          <Input type="number" step="0.1" min="0" placeholder="Ej: 1.5" {...register("areaHectareas")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea placeholder="Tipo de suelo, observaciones..." rows={2} {...register("notas")} />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        )}
        <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear parcela"}
        </Button>
      </div>
    </form>
  );
}
