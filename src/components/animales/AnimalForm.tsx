"use client";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { animalSchema, type AnimalInput } from "@/lib/validations";

interface Props {
  fincaId: string;
  onSubmit: (data: AnimalInput) => void;
  loading?: boolean;
  onCancel?: () => void;
  defaultValues?: Partial<AnimalInput>;
}

export function AnimalForm({ fincaId, onSubmit, loading, onCancel, defaultValues }: Props) {
  const [lotes, setLotes] = useState<{ id: string; nombre: string }[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AnimalInput>({
    resolver: zodResolver(animalSchema),
    defaultValues: { tipo: "VACA", sexo: "HEMBRA", estado: "ACTIVO", fincaId, ...defaultValues },
  });

  useEffect(() => {
    if (fincaId) setValue("fincaId", fincaId);
  }, [fincaId, setValue]);

  // Cargar lotes de la finca para el selector
  useEffect(() => {
    if (!fincaId) return;
    fetch(`/api/lotes?fincaId=${fincaId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLotes(d); });
  }, [fincaId]);

  const tipo = watch("tipo");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Código / Arete *</Label>
          <Input placeholder="Ej: 001, A-45" {...register("codigo")} />
          {errors.codigo && <p className="text-xs text-red-500">{errors.codigo.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Nombre (opcional)</Label>
          <Input placeholder="Ej: La Manchada" {...register("nombre")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de animal *</Label>
          <Select defaultValue={defaultValues?.tipo ?? "VACA"} onValueChange={(v) => setValue("tipo", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["VACA","TORO","TERNERO","TERNERA","CABALLO","YEGUA","OVEJA","CABRA","CERDO","OTRO"].map(t => (
                <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sexo *</Label>
          <Select defaultValue={defaultValues?.sexo ?? "HEMBRA"} onValueChange={(v) => setValue("sexo", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MACHO">Macho</SelectItem>
              <SelectItem value="HEMBRA">Hembra</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Raza</Label>
          <Input placeholder="Ej: Holstein, Brahman" {...register("raza")} />
        </div>
        <div className="space-y-2">
          <Label>Color / Marcas</Label>
          <Input placeholder="Ej: Negra con manchas blancas" {...register("color")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Edad (meses)</Label>
          <Input type="number" min="0" placeholder="0" {...register("edadMeses")} />
        </div>
        <div className="space-y-2">
          <Label>Peso estimado (kg)</Label>
          <Input type="number" min="0" step="0.5" placeholder="0" {...register("pesoEstimado")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estado *</Label>
          <Select defaultValue={defaultValues?.estado ?? "ACTIVO"} onValueChange={(v) => setValue("estado", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["ACTIVO","ENFERMO","EN_TRATAMIENTO","PRENADA","EN_CELO","SECO","VENDIDO","MUERTO"].map(e => (
                <SelectItem key={e} value={e}>{e.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Enfoque productivo</Label>
          <Select defaultValue={defaultValues?.enfoque ?? ""} onValueChange={(v) => setValue("enfoque", v as any)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LECHE">Leche</SelectItem>
              <SelectItem value="CARNE">Carne</SelectItem>
              <SelectItem value="CRIA">Cría</SelectItem>
              <SelectItem value="DOBLE_PROPOSITO">Doble propósito</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selector de lote */}
      <div className="space-y-2">
        <Label>Lote / Grupo <span className="text-stone-400 text-xs">(opcional)</span></Label>
        <Select
          defaultValue={defaultValues?.loteId ?? "__none__"}
          onValueChange={(v) => setValue("loteId", v === "__none__" ? undefined : v)}
        >
          <SelectTrigger><SelectValue placeholder="Sin lote asignado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Sin lote —</SelectItem>
            {lotes.map(l => (
              <SelectItem key={l.id} value={l.id}>🌿 {l.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {lotes.length === 0 && (
          <p className="text-[11px] text-stone-400">Cree un lote en la sección Lotes para asignar animales.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Notas adicionales</Label>
        <Textarea placeholder="Observaciones, características especiales..." rows={3} {...register("notas")} />
      </div>

      <input type="hidden" {...register("fincaId")} />

      <div className="flex gap-3 pt-2">
        {onCancel && <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar animal"}
        </Button>
      </div>
    </form>
  );
}

