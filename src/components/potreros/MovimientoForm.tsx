"use client";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { movimientoSchema, type MovimientoInput } from "@/lib/validations";

interface Props {
  potreroDestino: any;
  fincaId: string;
  onSubmit: (data: MovimientoInput) => void;
  loading?: boolean;
  onCancel?: () => void;
}

export function MovimientoForm({ potreroDestino, fincaId, onSubmit, loading, onCancel }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<MovimientoInput>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: { potreroId: potreroDestino?.id, fechaEntrada: new Date() },
  });

  const { data: lotes = [] } = useQuery({
    queryKey: ["lotes", fincaId],
    queryFn: async () => {
      const res = await fetch(`/api/lotes?fincaId=${fincaId}`);
      return res.json();
    },
    enabled: !!fincaId,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {potreroDestino && (
        <div className="bg-finca-green-50 border border-finca-green-200 rounded-xl p-3 text-sm">
          <p className="font-medium text-finca-green-800">Destino: {potreroDestino.nombre}</p>
          <p className="text-xs text-finca-green-600 mt-0.5">Cap. {potreroDestino.capacidadAnimales ?? "—"} animales · {potreroDestino.areHectareas ?? "—"} ha</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Lote a mover *</Label>
        <Select onValueChange={(v) => setValue("loteId", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar lote..." /></SelectTrigger>
          <SelectContent>
            {lotes.map((l: any) => (
              <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.loteId && <p className="text-xs text-red-500">{errors.loteId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Fecha de entrada</Label>
        <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} {...register("fechaEntrada")} />
      </div>

      <div className="space-y-2">
        <Label>Motivo del movimiento</Label>
        <Input placeholder="Ej: Rotación programada, pasto agotado..." {...register("motivo")} />
      </div>

      <input type="hidden" value={potreroDestino?.id} {...register("potreroId")} />

      <div className="flex gap-3 pt-2">
        {onCancel && <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar movimiento"}
        </Button>
      </div>
    </form>
  );
}
