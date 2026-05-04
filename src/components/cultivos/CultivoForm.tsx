"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cultivoSchema, type CultivoInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const TIPOS = [
  { value: "CAFE",    label: "☕ Café" },
  { value: "PLATANO", label: "🍌 Plátano / Banano" },
  { value: "YUCA",    label: "🌿 Yuca" },
  { value: "MAIZ",    label: "🌽 Maíz" },
  { value: "PASTO",   label: "🌾 Pasto" },
  { value: "CANA",    label: "🎋 Caña" },
  { value: "FRIJOL",  label: "🫘 Frijol" },
  { value: "TOMATE",  label: "🍅 Tomate" },
  { value: "PIPA",    label: "🥥 Pipa / Coco" },
  { value: "OTRO",    label: "🌱 Otro" },
];

const ETAPAS = [
  { value: "PREPARACION",    label: "Preparación del suelo" },
  { value: "SIEMBRA",        label: "Siembra" },
  { value: "GERMINACION",    label: "Germinación" },
  { value: "CRECIMIENTO",    label: "Crecimiento" },
  { value: "FLORACION",      label: "Floración" },
  { value: "FRUCTIFICACION", label: "Fructificación" },
  { value: "COSECHA",        label: "Cosecha" },
  { value: "POST_COSECHA",   label: "Post-cosecha" },
];

interface Props {
  fincaId: string;
  defaultValues?: Partial<CultivoInput>;
  onSubmit: (data: CultivoInput) => void;
  loading?: boolean;
  onCancel?: () => void;
  isEdit?: boolean;
}

export function CultivoForm({ fincaId, defaultValues, onSubmit, loading, onCancel, isEdit }: Props) {
  const [parcelas, setParcelas] = useState<{ id: string; nombre: string }[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CultivoInput>({
    resolver: zodResolver(cultivoSchema),
    defaultValues: { etapa: "PREPARACION", ...defaultValues },
  });

  useEffect(() => {
    fetch(`/api/parcelas?fincaId=${fincaId}`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setParcelas(data));
  }, [fincaId]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Tipo de cultivo */}
      <div className="space-y-2">
        <Label>Tipo de cultivo *</Label>
        <Select
          defaultValue={defaultValues?.tipo}
          onValueChange={(v) => setValue("tipo", v as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione el cultivo..." />
          </SelectTrigger>
          <SelectContent>
            {TIPOS.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tipo && <p className="text-xs text-red-500">{errors.tipo.message}</p>}
      </div>

      {/* Variedad */}
      <div className="space-y-2">
        <Label>Variedad <span className="text-stone-400 text-xs">(opcional)</span></Label>
        <Input placeholder="Ej: Catuaí, Williams, Criolla..." {...register("variedad")} />
      </div>

      {/* Parcela */}
      <div className="space-y-2">
        <Label>Parcela *</Label>
        {parcelas.length === 0 ? (
          <div className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            No hay parcelas creadas. Primero cree una parcela desde el selector de abajo.
          </div>
        ) : (
          <Select
            defaultValue={defaultValues?.parcelaId}
            onValueChange={(v) => setValue("parcelaId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione parcela..." />
            </SelectTrigger>
            <SelectContent>
              {parcelas.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.parcelaId && <p className="text-xs text-red-500">{errors.parcelaId.message}</p>}
      </div>

      {/* Etapa */}
      <div className="space-y-2">
        <Label>Etapa actual</Label>
        <Select
          defaultValue={defaultValues?.etapa ?? "PREPARACION"}
          onValueChange={(v) => setValue("etapa", v as any)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ETAPAS.map(e => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Área y fechas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Área (hectáreas)</Label>
          <Input type="number" step="0.1" min="0" placeholder="Ej: 2.5" {...register("areaHectareas")} />
        </div>
        <div className="space-y-2">
          <Label>Fecha de siembra</Label>
          <Input type="date" {...register("fechaSiembra")} />
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea placeholder="Observaciones, condiciones del suelo, insumos usados..." rows={2} {...register("notas")} />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 bg-finca-green-600 hover:bg-finca-green-700"
          disabled={loading || parcelas.length === 0}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Guardar cambios" : "Registrar cultivo"}
        </Button>
      </div>
    </form>
  );
}
