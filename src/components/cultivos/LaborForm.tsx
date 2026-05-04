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
  cultivoId: z.string(),
  tipo:      z.enum(["FERTILIZACION","LIMPIEZA","PODA","FUMIGACION","COSECHA","RIEGO","CONTROL_PLAGAS","SIEMBRA","OTRO"]),
  fecha:     z.string().optional(),
  producto:  z.string().optional(),
  cantidad:  z.coerce.number().positive().optional(),
  unidad:    z.string().optional(),
  costo:     z.coerce.number().nonnegative().optional(),
  notas:     z.string().optional(),
  realizado: z.boolean().default(true),
});

type LaborInput = z.infer<typeof schema>;

const TIPOS_LABOR = [
  { value: "FERTILIZACION",  label: "🌿 Fertilización" },
  { value: "LIMPIEZA",       label: "🧹 Limpieza / Chapea" },
  { value: "PODA",           label: "✂️ Poda" },
  { value: "FUMIGACION",     label: "💨 Fumigación / Agroquímico" },
  { value: "COSECHA",        label: "🌾 Cosecha" },
  { value: "RIEGO",          label: "💧 Riego" },
  { value: "CONTROL_PLAGAS", label: "🐛 Control de plagas" },
  { value: "SIEMBRA",        label: "🌱 Siembra / Resiembra" },
  { value: "OTRO",           label: "📝 Otro" },
];

interface Props {
  cultivoId: string;
  onSubmit: (data: LaborInput) => void;
  loading?: boolean;
  onCancel?: () => void;
}

export function LaborForm({ cultivoId, onSubmit, loading, onCancel }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LaborInput>({
    resolver: zodResolver(schema),
    defaultValues: { cultivoId, realizado: true },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("cultivoId")} value={cultivoId} />

      <div className="space-y-2">
        <Label>Tipo de labor *</Label>
        <Select onValueChange={(v) => setValue("tipo", v as any)}>
          <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
          <SelectContent>
            {TIPOS_LABOR.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tipo && <p className="text-xs text-red-500">Seleccione un tipo</p>}
      </div>

      <div className="space-y-2">
        <Label>Fecha</Label>
        <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} {...register("fecha")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Producto / Insumo</Label>
          <Input placeholder="Ej: Urea, Glifosato..." {...register("producto")} />
        </div>
        <div className="space-y-2">
          <Label>Unidad</Label>
          <Input placeholder="Ej: kg, litros, sacos..." {...register("unidad")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cantidad</Label>
          <Input type="number" step="0.1" min="0" placeholder="0" {...register("cantidad")} />
        </div>
        <div className="space-y-2">
          <Label>Costo (₡)</Label>
          <Input type="number" step="100" min="0" placeholder="0" {...register("costo")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea placeholder="Observaciones de la labor..." rows={2} {...register("notas")} />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        )}
        <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar labor"}
        </Button>
      </div>
    </form>
  );
}
