"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sprout, Loader2, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const schema = z.object({
  nombre:    z.string().min(2, "Nombre requerido (mínimo 2 caracteres)"),
  provincia: z.string().optional(),
  areaTotal: z.coerce.number().positive().optional(),
  enfoque:   z.enum(["ENGORDE","CRIA","LECHE","AGRICULTURA","MIXTA"]).default("MIXTA"),
});
type SetupInput = z.infer<typeof schema>;

const ENFOQUES = [
  { value: "LECHE",       label: "🥛 Producción de leche" },
  { value: "CRIA",        label: "🐮 Cría de ganado" },
  { value: "ENGORDE",     label: "🐂 Engorde" },
  { value: "AGRICULTURA", label: "🌱 Agricultura / Cultivos" },
  { value: "MIXTA",       label: "🌿 Mixta (varios usos)" },
];

export default function SetupPage() {
  const router  = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SetupInput>({
    resolver: zodResolver(schema),
    defaultValues: { enfoque: "MIXTA" },
  });

  async function onSubmit(data: SetupInput) {
    setSaving(true);
    try {
      const res = await fetch("/api/fincas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al crear finca");
      }
      toast({ title: "✅ ¡Finca creada!", description: "Bienvenido a FincaApp. Comenzando..." });
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-finca-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">¡Bienvenido a FincaApp!</h1>
          <p className="text-stone-500 text-sm mt-2">
            Para comenzar, registre su finca. Solo toma 30 segundos.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-finca-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs text-stone-500">Cuenta creada</span>
          </div>
          <div className="w-8 h-px bg-stone-200" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-finca-green-600 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">2</span>
            </div>
            <span className="text-xs font-medium text-stone-700">Crear finca</span>
          </div>
          <div className="w-8 h-px bg-stone-200" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-stone-200 rounded-full flex items-center justify-center">
              <span className="text-xs text-stone-400 font-bold">3</span>
            </div>
            <span className="text-xs text-stone-400">Listo</span>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-finca-green-600" />
            <h2 className="font-semibold text-stone-900">Datos de su finca</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la finca *</Label>
              <Input
                placeholder="Ej: Finca El Progreso, Hacienda La Esperanza..."
                {...register("nombre")}
                className="h-11"
              />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Provincia <span className="text-stone-400 text-xs">(opcional)</span></Label>
              <Input
                placeholder="Ej: Cartago, San José..."
                {...register("provincia")}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Área total (ha) <span className="text-stone-400 text-xs">(opcional)</span></Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ej: 50"
                  {...register("areaTotal")}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Enfoque principal</Label>
                <Select defaultValue="MIXTA" onValueChange={(v) => setValue("enfoque", v as any)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENFOQUES.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-finca-green-600 hover:bg-finca-green-700 text-sm font-semibold mt-2"
              disabled={saving}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creando finca...</>
                : <><Sprout className="w-4 h-4 mr-2" /> Crear mi finca y continuar</>
              }
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-stone-400 mt-4">
          Puede agregar más detalles y múltiples fincas desde Configuración
        </p>
      </div>
    </div>
  );
}
