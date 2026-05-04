"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Syringe, Heart, Baby, Trash2, Scale } from "lucide-react";
import { cn, getEstadoColor, formatFecha, formatPeso, TIPO_ANIMAL_LABELS } from "@/lib/utils";
import { HistorialForm } from "@/components/animales/HistorialForm";
import { CeloForm } from "@/components/animales/CeloForm";
import { PartoForm } from "@/components/animales/PartoForm";
import { PesoPanel } from "@/components/peso/PesoPanel";
import { useToast } from "@/components/ui/use-toast";

interface Props { animal: any; }

const TIPO_ICON: Record<string, string> = {
  VACUNA: "💉", VITAMINA: "🧪", DESPARASITANTE: "🪱",
  MEDICAMENTO: "💊", CIRUGIA: "🔪", DIAGNOSTICO: "🔍", OTRO: "📋",
};
const TIPO_ANIMAL_ICON: Record<string, string> = {
  VACA:"🐄",TORO:"🐂",TERNERO:"🐮",TERNERA:"🐮",CABALLO:"🐴",YEGUA:"🐴",OVEJA:"🐑",CABRA:"🐐",CERDO:"🐷",OTRO:"🐾",
};

export function AnimalDetalle({ animal }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [modal, setModal] = useState<"historial"|"celo"|"parto"|null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => router.refresh();

  const postMedico = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch("/api/historial-medico", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, animalId: animal.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "✅ Registro médico guardado" });
      setModal(null); refresh();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  const postCelo = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch("/api/celos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, animalId: animal.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "✅ Celo registrado" });
      setModal(null); refresh();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  const postParto = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch("/api/partos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, animalId: animal.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const result = await res.json();
      const criasRegistradas = result.criasRegistradas?.length ?? 0;
      const msg = criasRegistradas > 0
        ? `✅ Parto registrado y ${criasRegistradas} cría(s) añadida(s) a animales`
        : "✅ Parto registrado";
      toast({ title: msg });
      setModal(null); refresh();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  const deleteMedico = async (id: string) => {
    if (!confirm("¿Eliminar este registro médico?")) return;
    const res = await fetch(`/api/historial-medico/${id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Registro eliminado" }); refresh(); }
    else toast({ title: "Error al eliminar", variant: "destructive" } as any);
  };

  const deleteCelo = async (id: string) => {
    if (!confirm("¿Eliminar este registro de celo?")) return;
    const res = await fetch(`/api/celos?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Registro eliminado" }); refresh(); }
  };

  const deleteParto = async (id: string) => {
    if (!confirm("¿Eliminar este registro de parto?")) return;
    const res = await fetch(`/api/partos?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Registro eliminado" }); refresh(); }
  };

  return (
    <div className="space-y-6">
      {/* Info general */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-finca-green-50 rounded-2xl flex items-center justify-center text-4xl">
              {TIPO_ANIMAL_ICON[animal.tipo] ?? "🐾"}
            </div>
            <div>
              <p className="text-xs text-stone-400 font-mono">#{animal.codigo}</p>
              <h3 className="text-xl font-bold text-stone-900">{animal.nombre ?? `Animal ${animal.codigo}`}</h3>
              <p className="text-sm text-stone-500">{TIPO_ANIMAL_LABELS[animal.tipo]} · {animal.raza ?? "Raza no especificada"}</p>
            </div>
          </div>
          <Badge className={cn("text-sm px-3 py-1", getEstadoColor(animal.estado))}>
            {animal.estado.replace(/_/g, " ")}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { label: "Sexo",     value: animal.sexo },
            { label: "Edad",     value: animal.edadMeses ? `${animal.edadMeses} meses` : "—" },
            { label: "Peso",     value: formatPeso(animal.pesoEstimado) },
            { label: "Color",    value: animal.color ?? "—" },
            { label: "Lote",     value: animal.lote?.nombre ?? "Sin lote" },
            { label: "Finca",    value: animal.finca?.nombre },
            { label: "Enfoque",  value: animal.enfoque?.replace(/_/g," ") ?? "—" },
            { label: "Registro", value: formatFecha(animal.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-stone-50 rounded-xl p-3">
              <p className="text-xs text-stone-400 font-medium mb-0.5">{label}</p>
              <p className="font-semibold text-stone-800 text-sm truncate">{value}</p>
            </div>
          ))}
        </div>

        {animal.notas && (
          <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-xl p-3">
            <p className="text-xs font-medium text-yellow-700 mb-1">Notas</p>
            <p className="text-sm text-yellow-800">{animal.notas}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="medico">
        <TabsList className="w-full">
          <TabsTrigger value="medico" className="flex-1">
            <Syringe className="w-4 h-4 mr-1.5" />
            Historial ({animal.historialMedico?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="celos" className="flex-1">
            <Heart className="w-4 h-4 mr-1.5" />
            Celos ({animal.celos?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="partos" className="flex-1">
            <Baby className="w-4 h-4 mr-1.5" />
            Partos ({animal.partos?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="peso" className="flex-1">
            <Scale className="w-4 h-4 mr-1.5" />
            Peso
          </TabsTrigger>
        </TabsList>

        {/* ── HISTORIAL MÉDICO ── */}
        <TabsContent value="medico">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-stone-900">Registros médicos</h4>
              <Button size="sm" onClick={() => setModal("historial")} className="bg-finca-green-600 hover:bg-finca-green-700">
                <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
              </Button>
            </div>
            {(animal.historialMedico?.length ?? 0) === 0 ? (
              <div className="text-center py-10">
                <Syringe className="w-10 h-10 text-stone-200 mx-auto mb-2" />
                <p className="text-stone-400 text-sm">Sin registros médicos</p>
                <p className="text-stone-300 text-xs mt-1">Vacunas, desparasitantes, tratamientos...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {animal.historialMedico.map((h: any) => (
                  <div key={h.id} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl group">
                    <span className="text-xl mt-0.5 flex-shrink-0">{TIPO_ICON[h.tipo] ?? "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-sm text-stone-800">{h.producto}</p>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {h.tipo.charAt(0)+h.tipo.slice(1).toLowerCase()}
                            {h.dosis ? ` · ${h.dosis}` : ""}
                            {h.viaAdministracion ? ` · ${h.viaAdministracion}` : ""}
                            {h.veterinario ? ` · Dr. ${h.veterinario}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-stone-400">{formatFecha(h.fecha)}</span>
                          <button
                            onClick={() => deleteMedico(h.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {h.proximaFecha && (
                        <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                          📅 Próxima aplicación: <span className="font-medium">{formatFecha(h.proximaFecha)}</span>
                        </p>
                      )}
                      {h.costo && (
                        <p className="text-xs text-stone-400 mt-0.5">💰 Costo: ₡{h.costo.toLocaleString()}</p>
                      )}
                      {h.notas && <p className="text-xs text-stone-400 mt-1 italic">{h.notas}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── CELOS ── */}
        <TabsContent value="celos">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-stone-900">Registro de celos</h4>
              <Button size="sm" onClick={() => setModal("celo")} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="w-3.5 h-3.5 mr-1" /> Registrar celo
              </Button>
            </div>
            {(animal.celos?.length ?? 0) === 0 ? (
              <div className="text-center py-10">
                <Heart className="w-10 h-10 text-pink-100 mx-auto mb-2" />
                <p className="text-stone-400 text-sm">Sin registros de celo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {animal.celos.map((c: any) => (
                  <div key={c.id} className="p-3 bg-pink-50 border border-pink-100 rounded-xl group">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-pink-800 text-sm">❤️ {formatFecha(c.fecha)}</p>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {c.intensidad && <span className="text-xs text-pink-600 bg-pink-100 rounded-md px-2 py-0.5">{c.intensidad}</span>}
                          {c.monta && <span className="text-xs text-stone-600">🐂 Monta natural</span>}
                          {c.inseminacion && <span className="text-xs text-stone-600">🧬 Inseminación</span>}
                          {c.toro && <span className="text-xs text-stone-500">Toro: {c.toro}</span>}
                        </div>
                        {c.resultado && (
                          <p className="text-xs mt-1 font-medium text-pink-700">
                            {c.resultado === "PREÑADA" ? "✅ Preñada" : c.resultado === "NO_PREÑADA" ? "❌ No preñada" : "⏳ Pendiente confirmar"}
                          </p>
                        )}
                        {c.notas && <p className="text-xs text-stone-400 mt-1 italic">{c.notas}</p>}
                      </div>
                      <button
                        onClick={() => deleteCelo(c.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 text-red-400 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── PARTOS ── */}
        <TabsContent value="partos">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-stone-900">Registro de partos</h4>
              <Button size="sm" onClick={() => setModal("parto")} className="bg-finca-green-600 hover:bg-finca-green-700">
                <Plus className="w-3.5 h-3.5 mr-1" /> Registrar parto
              </Button>
            </div>
            {(animal.partos?.length ?? 0) === 0 ? (
              <div className="text-center py-10">
                <Baby className="w-10 h-10 text-stone-200 mx-auto mb-2" />
                <p className="text-stone-400 text-sm">Sin partos registrados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {animal.partos.map((p: any) => (
                  <div key={p.id} className="p-3 bg-green-50 border border-green-100 rounded-xl group">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-green-800 text-sm">🐄 {formatFecha(p.fecha)}</p>
                          {p.tipoParto && <span className="text-xs bg-green-100 text-green-700 rounded-md px-2 py-0.5">{p.tipoParto}</span>}
                        </div>
                        <div className="text-xs text-stone-600 mt-1 flex gap-3 flex-wrap">
                          <span>🍼 {p.crias} cría(s)</span>
                          {p.sexoCria && <span>{p.sexoCria === "MACHO" ? "🐂 Macho" : p.sexoCria === "HEMBRA" ? "🐄 Hembra" : "Mixto"}</span>}
                          {p.pesoAlNacer && <span>⚖️ {p.pesoAlNacer} kg</span>}
                          {p.estadoCria && <span className={p.estadoCria === "VIVO" ? "text-green-600" : "text-red-500"}>
                            {p.estadoCria === "VIVO" ? "✅ Vivo" : p.estadoCria === "DEBIL" ? "⚠️ Débil" : "❌ Muerto"}
                          </span>}
                        </div>
                        {p.complicaciones && <p className="text-xs text-orange-600 mt-1">⚠️ {p.complicaciones}</p>}
                        {p.proximoParto && <p className="text-xs text-blue-600 mt-1">📅 Próximo: {formatFecha(p.proximoParto)}</p>}
                        {p.notas && <p className="text-xs text-stone-400 mt-1 italic">{p.notas}</p>}
                      </div>
                      <button
                        onClick={() => deleteParto(p.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 text-red-400 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── PESO ── */}
        <TabsContent value="peso" className="mt-4">
          <PesoPanel
            animalId={animal.id}
            animalNombre={animal.nombre ?? animal.codigo}
          />
        </TabsContent>
      </Tabs>

      {/* Modales */}
      <Dialog open={modal === "historial"} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>💉 Agregar registro médico</DialogTitle></DialogHeader>
          <HistorialForm onSubmit={postMedico} loading={saving} onCancel={() => setModal(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "celo"} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>❤️ Registrar celo</DialogTitle></DialogHeader>
          <CeloForm onSubmit={postCelo} loading={saving} onCancel={() => setModal(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "parto"} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>🐄 Registrar parto</DialogTitle></DialogHeader>
          <PartoForm onSubmit={postParto} loading={saving} onCancel={() => setModal(null)} razaMadre={animal.raza ?? undefined} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
