"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Users, Loader2, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loteSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional(),
  fincaId: z.string(),
  tipo: z.enum(["ENGORDE","CRIA","LECHE","MIXTO"]).default("MIXTO"),
});
type LoteInput = z.infer<typeof loteSchema>;

const TIPO_CONFIG: Record<string, { emoji: string; variant: any; label: string; gradient: string }> = {
  ENGORDE: { emoji: "🐂", variant: "warning",   label: "Engorde",  gradient: "from-amber-400 to-orange-500" },
  CRIA:    { emoji: "🐮", variant: "info",       label: "Cría",     gradient: "from-blue-400 to-sky-500" },
  LECHE:   { emoji: "🥛", variant: "default",    label: "Leche",    gradient: "from-green-400 to-emerald-500" },
  MIXTO:   { emoji: "🌿", variant: "secondary",  label: "Mixto",    gradient: "from-stone-300 to-stone-400" },
};

function LoteCard({ lote, onEdit, onDelete }: { lote: any; onEdit: (l: any) => void; onDelete: (id: string) => void }) {
  const cfg = TIPO_CONFIG[lote.tipo] ?? TIPO_CONFIG.MIXTO;
  const potreroActual = lote.movimientos?.[0]?.potrero;
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all overflow-hidden">
      <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.gradient}`} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-stone-50 rounded-xl flex items-center justify-center text-2xl">{cfg.emoji}</div>
            <div>
              <p className="font-semibold text-stone-900 text-sm">{lote.nombre}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">{lote._count?.animales ?? 0} animales</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={cfg.variant as any}>{cfg.label}</Badge>
          </div>
        </div>

        {potreroActual && (
          <div className="flex items-center gap-1.5 bg-finca-green-50 text-finca-green-700 rounded-lg px-2.5 py-1.5 mb-3">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs font-medium truncate">En: {potreroActual.nombre}</span>
          </div>
        )}

        {lote.descripcion && (
          <p className="text-[11px] text-stone-400 line-clamp-2 mb-3">{lote.descripcion}</p>
        )}

        <div className="flex items-center gap-2 pt-2.5 border-t border-stone-50">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onEdit(lote)}>
            <Pencil className="w-3 h-3 mr-1" /> Editar
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(lote.id)}>
            <Trash2 className="w-3 h-3 mr-1" /> Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoteForm({ fincaId, defaultValues, onSubmit, loading, onCancel, isEdit }: {
  fincaId: string; defaultValues?: Partial<LoteInput>;
  onSubmit: (d: LoteInput) => void; loading?: boolean; onCancel?: () => void; isEdit?: boolean;
}) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoteInput>({
    resolver: zodResolver(loteSchema),
    defaultValues: { fincaId, tipo: "MIXTO", ...defaultValues },
  });

  useEffect(() => {
    if (fincaId) setValue("fincaId", fincaId);
  }, [fincaId, setValue]);
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("fincaId")} />
      <div className="space-y-2">
        <Label>Nombre del lote *</Label>
        <Input placeholder="Ej: Lote A, Vacas lecheras, Novillos..." {...register("nombre")} />
        {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Tipo de producción</Label>
        <Select defaultValue={defaultValues?.tipo ?? "MIXTO"} onValueChange={(v) => setValue("tipo", v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ENGORDE">🐂 Engorde</SelectItem>
            <SelectItem value="CRIA">🐮 Cría</SelectItem>
            <SelectItem value="LECHE">🥛 Leche</SelectItem>
            <SelectItem value="MIXTO">🌿 Mixto</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Descripción <span className="text-stone-400 text-xs">(opcional)</span></Label>
        <Textarea placeholder="Características del lote..." rows={2} {...register("descripcion")} />
      </div>
      <div className="flex gap-3 pt-2">
        {onCancel && <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" className="flex-1 bg-finca-green-600 hover:bg-finca-green-700" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Guardar cambios" : "Crear lote"}
        </Button>
      </div>
    </form>
  );
}

export default function LotesPage() {
  const { toast } = useToast();
  const [lotes, setLotes] = useState<any[]>([]);
  const [fincaId, setFincaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<"nuevo" | "editar" | null>(null);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch("/api/fincas").then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) setFincaId(d[0].id);
    });
  }, []);

  const loadLotes = useCallback(() => {
    if (!fincaId) return;
    setLoading(true);
    fetch(`/api/lotes?fincaId=${fincaId}`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setLotes(d);
    }).finally(() => setLoading(false));
  }, [fincaId]);

  useEffect(() => { loadLotes(); }, [loadLotes]);

  async function handleCrear(data: LoteInput) {
    setSaving(true);
    const res = await fetch("/api/lotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { toast({ title: "✅ Lote creado" }); setDialog(null); loadLotes(); }
    else { const e = await res.json(); toast({ title: "Error", description: e.error, variant: "destructive" }); }
    setSaving(false);
  }

  async function handleEditar(data: LoteInput) {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/lotes/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { toast({ title: "✅ Lote actualizado" }); setDialog(null); setSelected(null); loadLotes(); }
    else { const e = await res.json(); toast({ title: "Error", description: e.error, variant: "destructive" }); }
    setSaving(false);
  }

  async function handleEliminar(id: string) {
    const res = await fetch(`/api/lotes/${id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Lote eliminado" }); loadLotes(); }
  }

  const totalAnimales = lotes.reduce((s, l) => s + (l._count?.animales ?? 0), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-finca-green-600" /> Lotes de Ganado
          </h2>
          <p className="text-stone-500 text-sm mt-0.5">Organice su ganado en grupos o lotes por producción</p>
        </div>
        <Button size="sm" onClick={() => setDialog("nuevo")} className="bg-finca-green-600 hover:bg-finca-green-700 gap-1.5">
          <Plus className="w-4 h-4" /> Nuevo lote
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-finca-green-600">{lotes.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Lotes</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{totalAnimales}</p>
          <p className="text-xs text-stone-500 mt-0.5">Animales en lotes</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-finca-green-500" /></div>
      ) : lotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-200 py-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-finca-green-50 rounded-2xl flex items-center justify-center text-3xl">🐄</div>
          <div>
            <p className="font-semibold text-stone-700">No hay lotes registrados</p>
            <p className="text-sm text-stone-400 mt-1 max-w-xs">Los lotes agrupan su ganado por tipo de producción para facilitar el manejo.</p>
          </div>
          <Button onClick={() => setDialog("nuevo")} className="bg-finca-green-600 hover:bg-finca-green-700 gap-2">
            <Plus className="w-4 h-4" /> Crear primer lote
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lotes.map(l => (
            <LoteCard key={l.id} lote={l}
              onEdit={(lote) => { setSelected(lote); setDialog("editar"); }}
              onDelete={handleEliminar}
            />
          ))}
        </div>
      )}

      <Dialog open={dialog === "nuevo"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-finca-green-600" /> Crear nuevo lote</DialogTitle></DialogHeader>
          <LoteForm fincaId={fincaId} onSubmit={handleCrear} loading={saving} onCancel={() => setDialog(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "editar"} onOpenChange={o => { if (!o) { setDialog(null); setSelected(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-finca-green-600" /> Editar lote</DialogTitle></DialogHeader>
          {selected && <LoteForm fincaId={fincaId} isEdit defaultValues={selected} onSubmit={handleEditar} loading={saving} onCancel={() => { setDialog(null); setSelected(null); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
