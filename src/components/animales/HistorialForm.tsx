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

// Schema local sin animalId para el formulario
const formSchema = z.object({
  tipo: z.enum(["VACUNA","VITAMINA","DESPARASITANTE","MEDICAMENTO","CIRUGIA","DIAGNOSTICO","OTRO"]),
  fecha: z.string().default(() => new Date().toISOString().split("T")[0]),
  producto: z.string().min(1, "Producto requerido"),
  dosis: z.string().optional(),
  viaAdministracion: z.string().optional(),
  veterinario: z.string().optional(),
  costo: z.coerce.number().min(0).optional(),
  proximaFecha: z.string().optional(),
  notas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onSubmit: (data: any) => void;
  loading?: boolean;
  onCancel?: () => void;
}

export function HistorialForm({ onSubmit, loading, onCancel }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { tipo: "VACUNA", fecha: new Date().toISOString().split("T")[0] },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de registro *</Label>
          <Select defaultValue="VACUNA" onValueChange={(v) => setValue("tipo", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["VACUNA","VITAMINA","DESPARASITANTE","MEDICAMENTO","CIRUGIA","DIAGNOSTICO","OTRO"].map(t => (
                <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fecha *</Label>
          <Input type="date" {...register("fecha")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Producto / Vacuna / Medicamento *</Label>
        <Input placeholder="Ej: Ivermectina, Complejo B, Aftosa..." {...register("producto")} />
        {errors.producto && <p className="text-xs text-red-500">{errors.producto.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Dosis</Label>
          <Input placeholder="Ej: 5ml, 2 tabletas" {...register("dosis")} />
        </div>
        <div className="space-y-2">
          <Label>Vía de administración</Label>
          <Input placeholder="Ej: Subcutáneo, oral" {...register("viaAdministracion")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Veterinario</Label>
          <Input placeholder="Nombre del veterinario" {...register("veterinario")} />
        </div>
        <div className="space-y-2">
          <Label>Costo (₡)</Label>
          <Input type="number" min="0" step="100" placeholder="0" {...register("costo")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Próxima aplicación</Label>
        <Input type="date" {...register("proximaFecha")} />
      </div>

      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea placeholder="Observaciones adicionales..." rows={2} {...register("notas")} />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar registro"}
        </Button>
      </div>
    </form>
  );
}
