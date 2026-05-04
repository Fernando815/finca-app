"use client";
import dynamic from "next/dynamic";

// Konva solo puede correr en el cliente
const CroquisCanvas = dynamic(() => import("@/components/croquis/CroquisCanvas"), { ssr: false });

export default function CroquisPage() {
  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Croquis de Finca</h2>
        <p className="text-gray-500 text-sm">Dibuje y organice visualmente su finca. Toque y arrastre para mover elementos.</p>
      </div>
      <CroquisCanvas />
    </div>
  );
}
