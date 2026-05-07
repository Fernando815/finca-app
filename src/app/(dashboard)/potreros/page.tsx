"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Grid3X3, ArrowRightLeft, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PotreroForm } from "@/components/potreros/PotreroForm";
import { MovimientoForm } from "@/components/potreros/MovimientoForm";
import { cn, formatArea, diasEnPotrero } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useFinca } from "@/lib/FincaContext";
import Link from "next/link";

export default function PotrerosPage() {
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalMover, setModalMover] = useState<any>(null);
  const { fincaId } = useFinca();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: potreros = [], isLoading } = useQuery({
    queryKey: ["potreros", fincaId],
    queryFn: async () => {
      const res = await fetch(`/api/potreros?fincaId=${fincaId}`);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: !!fincaId,
  });

  const crearMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/potreros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, fincaId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["potreros"] }); setModalNuevo(false); toast({ title: "Potrero creado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const moverMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["potreros"] }); setModalMover(null); toast({ title: "Lote movido exitosamente 🌿" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

function PotreroCard({ p, fincaId, onMover }: { p: any; fincaId: string; onMover: (p: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const mov = p.movActual;
  const dias = p.diasActual;
  const necesita = p.necesitaRotacion;

  const { data: animalesLote = [], isFetching } = useQuery({
    queryKey: ["animales-lote", mov?.lote?.id],
    queryFn: async () => {
      const res = await fetch(`/api/animales?fincaId=${fincaId}&loteId=${mov.lote.id}`);
      return res.json();
    },
    enabled: expanded && !!mov?.lote?.id,
  });

  const estadoColor: Record<string, string> = {
    EXCELENTE: "bg-green-100 text-green-800",
    BUENO:     "bg-lime-100 text-lime-800",
    REGULAR:   "bg-yellow-100 text-yellow-800",
    MALO:      "bg-red-100 text-red-800",
    DESCANSANDO:"bg-amber-100 text-amber-800 border border-amber-300",
  };

  const enDescanso = p.estadoPasto === "DESCANSANDO";

  return (
    <div className={cn(
      "bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md",
      necesita      ? "border-orange-300 bg-orange-50" :
      enDescanso    ? "border-amber-200 bg-amber-50/40" : "border-gray-100"
    )}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-gray-900 text-lg">
              {p.numero ? `P${p.numero} · ` : ""}{p.nombre}
            </p>
            <p className="text-xs text-gray-400">{formatArea(p.areHectareas)}</p>
          </div>
          <Badge className={estadoColor[p.estadoPasto] ?? "bg-gray-100 text-gray-700"}>
            {p.estadoPasto}
          </Badge>
        </div>

        {necesita && (
          <div className="bg-orange-100 border border-orange-200 rounded-xl px-3 py-2 mb-3">
            <p className="text-xs font-semibold text-orange-700">
              ⚠️ Lote <strong>{mov?.lote?.nombre}</strong> lleva <strong>{dias} días</strong> — debe rotar
            </p>
          </div>
        )}

        {mov ? (          <div className="bg-green-50 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-green-700">🌿 Lote actual</p>
              <Button variant="ghost" size="sm" className="h-6 px-1 text-xs text-green-600"
                onClick={() => setExpanded(e => !e)}>
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {mov.lote?.animales?.length ?? "?"} animales
              </Button>
            </div>
            <p className="text-sm font-semibold text-green-800">{mov.lote?.nombre}</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
              <Clock className="w-3 h-3" />
              <span>{dias} días · máx {p.diasOcupacionMaximo} días</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-1.5 mt-2">
              <div
                className={cn("h-1.5 rounded-full", necesita ? "bg-orange-500" : "bg-green-500")}
                style={{ width: `${Math.min((dias / p.diasOcupacionMaximo) * 100, 100)}%` }}
              />
            </div>

            {/* Lista de animales expandible */}
            {expanded && (
              <div className="mt-3 border-t border-green-200 pt-2 space-y-1">
                {isFetching ? (
                  <p className="text-xs text-green-600 text-center py-1">Cargando animales...</p>
                ) : animalesLote.length === 0 ? (
                  <p className="text-xs text-green-600 text-center py-1">Sin animales asignados al lote</p>
                ) : animalesLote.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between bg-white rounded-lg px-2 py-1">
                    <span className="text-xs font-medium text-gray-700">#{a.codigo} {a.nombre ?? ""}</span>
                    <span className="text-[10px] text-gray-400">{a.tipo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={cn("rounded-xl p-3 mb-3 text-center", enDescanso ? "bg-amber-50 border border-amber-200" : "bg-blue-50")}>
            {enDescanso ? (
              <div>
                <p className="text-xs text-amber-700 font-medium mb-2">🌿 En descanso · Recuperando pasto</p>
                {p.diasDescansando !== null && (
                  <>
                    <div className="flex justify-between text-[10px] text-amber-600 mb-1">
                      <span>{p.diasDescansando} días descansando</span>
                      <span>mín {p.diasDescansoMinimo} días</span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-amber-500 transition-all"
                        style={{ width: `${Math.min((p.diasDescansando / p.diasDescansoMinimo) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-amber-600 mt-1">
                      {p.diasDescansando >= p.diasDescansoMinimo
                        ? "✅ Descanso completo · listo al recargar"
                        : `Faltan ${p.diasDescansoMinimo - p.diasDescansando} días`}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-blue-600">✅ Disponible · Listo para recibir lote</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Cap: {p.capacidadAnimales ?? "—"} animales</span>
          <Button
            size="sm"
            variant="outline"
            className={cn("h-7 text-xs", mov ? "opacity-40 cursor-not-allowed" : "")}
            onClick={() => !mov && onMover(p)}
            disabled={!!mov}
            title={mov ? `Ocupado por ${mov.lote?.nombre} — rote el lote primero` : "Mover un lote a este potrero"}
          >
            <ArrowRightLeft className="w-3 h-3 mr-1" />
            {mov ? "Ocupado" : "Mover lote"}
          </Button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Potreros y Rotación</h2>
          <p className="text-gray-500 text-sm">{potreros.length} potreros registrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/potreros/rotacion">
              <ArrowRightLeft className="w-4 h-4 mr-2" /> Ver rotación
            </Link>
          </Button>
          <Button onClick={() => setModalNuevo(true)} className="bg-finca-green-600 hover:bg-finca-green-700">
            <Plus className="w-4 h-4 mr-2" /> Nuevo potrero
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : potreros.length === 0 ? (
        <EmptyState
          icon={Grid3X3}
          title="No hay potreros registrados"
          description="Cree sus potreros para comenzar a gestionar la rotación del ganado."
          action={{ label: "Crear potrero", onClick: () => setModalNuevo(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {potreros.map((p: any) => (
            <PotreroCard key={p.id} p={p} fincaId={fincaId} onMover={(potrero) => setModalMover({ potrero })} />
          ))}
        </div>
      )}

      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Crear potrero</DialogTitle></DialogHeader>
          <PotreroForm fincaId={fincaId} onSubmit={crearMutation.mutate} loading={crearMutation.isPending} onCancel={() => setModalNuevo(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!modalMover} onOpenChange={() => setModalMover(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mover lote a {modalMover?.potrero?.nombre}</DialogTitle>
          </DialogHeader>
          <MovimientoForm
            potreroDestino={modalMover?.potrero}
            fincaId={fincaId}
            onSubmit={moverMutation.mutate}
            loading={moverMutation.isPending}
            onCancel={() => setModalMover(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
