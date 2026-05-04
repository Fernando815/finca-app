"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { potreroSchema, type PotreroInput } from "@/lib/validations";

interface Props {
  fincaId: string;
  onSubmit: (data: PotreroInput) => void;
  loading?: boolean;
  onCancel?: () => void;
}

export function PotreroForm({ fincaId, onSubmit, loading, onCancel }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PotreroInput>({
    resolver: zodResolver(potreroSchema),
    defaultValues: { fincaId, tipoUso: "MIXTO", estadoPasto: "BUENO", diasDescansoMinimo: 21, diasOcupacionMaximo: 7 },
  });

  useEffect(() => {
    if (fincaId) setValue("fincaId", fincaId);
  }, [fincaId, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre *</Label>
          <Input placeholder="Ej: Potrero Norte" {...register("nombre")} />
          {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Número</Label>
          <Input type="number" placeholder="1" {...register("numero")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Área (hectáreas)</Label>
          <Input type="number" step="0.1" placeholder="0.0" {...register("areHectareas")} />
        </div>
        <div className="space-y-2">
          <Label>Capacidad (animales)</Label>
          <Input type="number" placeholder="0" {...register("capacidadAnimales")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de uso</Label>
          <Select defaultValue="MIXTO" onValueChange={(v) => setValue("tipoUso", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["ENGORDE","CRIA","LECHE","MIXTO"].map(t => (
                <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estado del pasto</Label>
          <Select defaultValue="BUENO" onValueChange={(v) => setValue("estadoPasto", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["EXCELENTE","BUENO","REGULAR","MALO","DESCANSANDO"].map(e => (
                <SelectItem key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Días máx. ocupación</Label>
          <Input type="number" min="1" max="30" {...register("diasOcupacionMaximo")} />
        </div>
        <div className="space-y-2">
          <Label>Días mín. descanso</Label>
          <Input type="number" min="7" max="90" {...register("diasDescansoMinimo")} />
        </div>
      </div>

      <input type="hidden" {...register("fincaId")} />

      <div className="flex gap-3 pt-2">
        {onCancel && <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar potrero"}
        </Button>
      </div>
    </form>
  );
}
