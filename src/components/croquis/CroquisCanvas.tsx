"use client";
import { useState, useRef, useCallback } from "react";
import { Stage, Layer, Rect, Circle, Line, Text, Transformer, Group } from "react-konva";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Square, Circle as CircleIcon, Minus, Type, Trash2,
  Save, RotateCcw, ZoomIn, ZoomOut, Grid3X3, Waves, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Konva from "konva";

type TipoElemento = "POTRERO" | "CAMINO" | "BEBEDERO" | "CORRAL" | "BODEGA" | "CULTIVO" | "TEXTO";
type Herramienta = "SELECCIONAR" | TipoElemento;

interface Elemento {
  id: string;
  tipo: TipoElemento;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  text?: string;
  fill?: string;
  stroke?: string;
  draggable: boolean;
  label?: string;
}

const COLORES: Record<TipoElemento, { fill: string; stroke: string }> = {
  POTRERO:  { fill: "#bbf7d0", stroke: "#16a34a" },
  CAMINO:   { fill: "#fef9c3", stroke: "#ca8a04" },
  BEBEDERO: { fill: "#bae6fd", stroke: "#0284c7" },
  CORRAL:   { fill: "#fde8d8", stroke: "#c2410c" },
  BODEGA:   { fill: "#e5e7eb", stroke: "#4b5563" },
  CULTIVO:  { fill: "#d9f99d", stroke: "#65a30d" },
  TEXTO:    { fill: "transparent", stroke: "transparent" },
};

const HERRAMIENTAS = [
  { tipo: "SELECCIONAR", label: "Seleccionar", icon: null, emoji: "👆" },
  { tipo: "POTRERO",  label: "Potrero",  icon: Grid3X3, emoji: "🌿" },
  { tipo: "CULTIVO",  label: "Cultivo",  icon: null,    emoji: "🌱" },
  { tipo: "BEBEDERO", label: "Bebedero", icon: Waves,   emoji: "💧" },
  { tipo: "CORRAL",   label: "Corral",   icon: Square,  emoji: "🐄" },
  { tipo: "BODEGA",   label: "Bodega",   icon: Home,    emoji: "🏠" },
  { tipo: "CAMINO",   label: "Camino",   icon: Minus,   emoji: "🛤️" },
  { tipo: "TEXTO",    label: "Texto",    icon: Type,    emoji: "T" },
] as const;

export default function CroquisCanvas() {
  const fincaId = typeof window !== "undefined" ? localStorage.getItem("fincaActiva") ?? "" : "";
  const [herramienta, setHerramienta] = useState<Herramienta>("SELECCIONAR");
  const [elementos, setElementos] = useState<Elemento[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [scale, setScale] = useState(1);
  const stageRef = useRef<Konva.Stage>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  // Cargar croquis
  useQuery({
    queryKey: ["croquis", fincaId],
    queryFn: async () => {
      const res = await fetch(`/api/croquis?fincaId=${fincaId}`);
      const data = await res.json();
      if (data?.data?.elementos) setElementos(data.data.elementos);
      return data;
    },
    enabled: !!fincaId,
  });

  const guardarMutation = useMutation({
    mutationFn: async () => {
      const uri = stageRef.current?.toDataURL({ pixelRatio: 0.5 });
      const res = await fetch("/api/croquis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fincaId, data: { elementos }, thumbnail: uri }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      return res.json();
    },
    onSuccess: () => toast({ title: "Croquis guardado ✅" }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const agregarElemento = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (herramienta === "SELECCIONAR") return;
    const stage = e.target.getStage();
    const pos = stage?.getRelativePointerPosition() ?? { x: 100, y: 100 };

    const id = `${herramienta}-${Date.now()}`;
    const color = COLORES[herramienta as TipoElemento];
    const numero = elementos.filter(el => el.tipo === herramienta).length + 1;

    let nuevo: Elemento;
    if (herramienta === "BEBEDERO") {
      nuevo = { id, tipo: herramienta, x: pos.x, y: pos.y, radius: 30, ...color, draggable: true, label: `Bebedero ${numero}` };
    } else if (herramienta === "TEXTO") {
      nuevo = { id, tipo: herramienta, x: pos.x, y: pos.y, text: "Texto", fill: "#1f2937", stroke: "transparent", draggable: true };
    } else {
      nuevo = { id, tipo: herramienta, x: pos.x - 60, y: pos.y - 40, width: 120, height: 80, ...color, draggable: true, label: `${herramienta.charAt(0) + herramienta.slice(1).toLowerCase()} ${numero}` };
    }
    setElementos(prev => [...prev, nuevo]);
    setSelectedId(id);
  }, [herramienta, elementos]);

  const actualizarPos = (id: string, x: number, y: number) => {
    setElementos(prev => prev.map(el => el.id === id ? { ...el, x, y } : el));
  };

  const eliminarSeleccionado = () => {
    if (!selectedId) return;
    setElementos(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const actualizarLabel = () => {
    if (!selectedId || !editLabel) return;
    setElementos(prev => prev.map(el => el.id === selectedId ? { ...el, label: editLabel, text: editLabel } : el));
  };

  const selectedEl = elementos.find(el => el.id === selectedId);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        {HERRAMIENTAS.map((h) => (
          <Button
            key={h.tipo}
            size="sm"
            variant={herramienta === h.tipo ? "default" : "outline"}
            className={herramienta === h.tipo ? "bg-finca-green-600 hover:bg-finca-green-700" : ""}
            onClick={() => setHerramienta(h.tipo as Herramienta)}
          >
            <span className="mr-1">{h.emoji}</span>
            <span className="hidden sm:inline">{h.label}</span>
          </Button>
        ))}

        <div className="flex-1" />

        {selectedId && (
          <div className="flex items-center gap-2">
            <Input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              placeholder="Nombre del elemento"
              className="h-8 w-40 text-sm"
            />
            <Button size="sm" variant="outline" onClick={actualizarLabel}>Renombrar</Button>
            <Button size="sm" variant="destructive" onClick={eliminarSeleccionado}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <Button size="sm" variant="outline" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => setScale(s => Math.min(2, s + 0.1))}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setElementos([]); setSelectedId(null); }}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          className="bg-finca-green-600 hover:bg-finca-green-700"
          onClick={() => guardarMutation.mutate()}
          disabled={guardarMutation.isPending}
        >
          <Save className="w-4 h-4 mr-1" />
          {guardarMutation.isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      {/* Canvas */}
      <div className="overflow-auto" style={{ height: "calc(100vh - 280px)", minHeight: 400 }}>
        <Stage
          ref={stageRef}
          width={typeof window !== "undefined" ? window.innerWidth - 100 : 800}
          height={600}
          scaleX={scale}
          scaleY={scale}
          onClick={agregarElemento}
          className="bg-gray-50"
          style={{ cursor: herramienta === "SELECCIONAR" ? "default" : "crosshair" }}
        >
          {/* Grid de fondo */}
          <Layer>
            {Array.from({ length: 40 }).map((_, i) => (
              <Line key={`h${i}`} points={[0, i * 30, 3000, i * 30]} stroke="#e5e7eb" strokeWidth={0.5} />
            ))}
            {Array.from({ length: 60 }).map((_, i) => (
              <Line key={`v${i}`} points={[i * 30, 0, i * 30, 3000]} stroke="#e5e7eb" strokeWidth={0.5} />
            ))}
          </Layer>

          {/* Elementos */}
          <Layer>
            {elementos.map((el) => {
              const isSelected = el.id === selectedId;
              const strokeW = isSelected ? 2.5 : 1.5;

              if (el.tipo === "BEBEDERO") {
                return (
                  <Group key={el.id} draggable onDragEnd={(e) => actualizarPos(el.id, e.target.x(), e.target.y())} onClick={() => { setSelectedId(el.id); setEditLabel(el.label ?? ""); }}>
                    <Circle x={el.x} y={el.y} radius={el.radius ?? 30} fill={el.fill} stroke={el.stroke} strokeWidth={strokeW} />
                    <Text text={el.label ?? ""} x={(el.x) - 35} y={(el.y) + (el.radius ?? 30) + 5} width={70} align="center" fontSize={11} fill="#1f2937" />
                  </Group>
                );
              }
              if (el.tipo === "TEXTO") {
                return (
                  <Text key={el.id} x={el.x} y={el.y} text={el.text ?? "Texto"} fontSize={14} fontStyle="bold" fill="#1f2937"
                    draggable onDragEnd={(e) => actualizarPos(el.id, e.target.x(), e.target.y())}
                    onClick={() => { setSelectedId(el.id); setEditLabel(el.text ?? ""); }}
                    stroke={isSelected ? "#16a34a" : undefined}
                  />
                );
              }
              return (
                <Group key={el.id} draggable onDragEnd={(e) => actualizarPos(el.id, e.target.x(), e.target.y())} onClick={() => { setSelectedId(el.id); setEditLabel(el.label ?? ""); }}>
                  <Rect
                    x={el.x} y={el.y}
                    width={el.width ?? 120} height={el.height ?? 80}
                    fill={el.fill} stroke={isSelected ? "#16a34a" : el.stroke}
                    strokeWidth={strokeW} cornerRadius={6}
                    shadowEnabled={isSelected} shadowBlur={8} shadowColor="#16a34a" shadowOpacity={0.3}
                  />
                  <Text
                    text={el.label ?? ""}
                    x={el.x + 4} y={el.y + (el.height ?? 80) / 2 - 8}
                    width={(el.width ?? 120) - 8}
                    align="center" fontSize={12} fontStyle="bold" fill="#1f2937"
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>

      <div className="p-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
        <span>💡 Seleccione una herramienta y toque el canvas para agregar elementos. Arrastre para mover.</span>
        <span>{elementos.length} elementos</span>
      </div>
    </div>
  );
}
