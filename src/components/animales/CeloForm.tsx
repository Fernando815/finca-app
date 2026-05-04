"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  fecha:        z.string().min(1, "Fecha requerida"),
  intensidad:   z.string().optional(),
  monta:        z.boolean().default(false),
  toro:         z.string().optional(),
  inseminacion: z.boolean().default(false),
  resultado:    z.string().optional(),
  notas:        z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: any) => void;
  loading?: boolean;
  onCancel?: () => void;
}

export function CeloForm({ onSubmit, loading, onCancel }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: new Date().toISOString().split("T")[0],
      monta: false,
      inseminacion: false,
    },
  });

  const monta = watch("monta");
  const inseminacion = watch("inseminacion");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha del celo *</Label>
          <Input type="date" {...register("fecha")} />
          {errors.fecha && <p className="text-xs text-red-500">{errors.fecha.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Intensidad</Label>
          <Select onValueChange={(v) => setValue("intensidad", v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LEVE">Leve</SelectItem>
              <SelectItem value="MODERADA">Moderada</SelectItem>
              <SelectItem value="INTENSA">Intensa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-stone-50">
          <input
            type="checkbox"
            className="w-4 h-4 accent-finca-green-600"
            checked={monta}
            onChange={(e) => setValue("monta", e.target.checked)}
          />
          <div>
            <p className="text-sm font-medium text-stone-700">🐂 Monta natural</p>
            <p className="text-xs text-stone-400">¿Se realizó monta?</p>
          </div>
        </label>
        <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-stone-50">
          <input
            type="checkbox"
            className="w-4 h-4 accent-finca-green-600"
            checked={inseminacion}
            onChange={(e) => setValue("inseminacion", e.target.checked)}
          />
          <div>
            <p className="text-sm font-medium text-stone-700">🧬 Inseminación</p>
            <p className="text-xs text-stone-400">¿Inseminación artificial?</p>
          </div>
        </label>
      </div>

      {(monta || inseminacion) && (
        <div className="space-y-2">
          <Label>{monta ? "Toro / Semental" : "Pajilla / Toro donante"}</Label>
          <Input placeholder="Nombre o código del toro/pajilla" {...register("toro")} />
        </div>
      )}

      <div className="space-y-2">
        <Label>Resultado</Label>
        <Select onValueChange={(v) => setValue("resultado", v)}>
          <SelectTrigger><SelectValue placeholder="Resultado (si se conoce)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PREÑADA">✅ Preñada</SelectItem>
            <SelectItem value="NO_PREÑADA">❌ No preñada</SelectItem>
            <SelectItem value="PENDIENTE">⏳ Pendiente confirmar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea placeholder="Observaciones..." rows={2} {...register("notas")} />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar celo"}
        </Button>
      </div>
    </form>
  );
}
