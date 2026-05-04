"use client";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import React from "react";

export function PDFButton({ data, fileName }: { data: any; fileName: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleDownload() {
    setLoading(true);
    setError(false);
    try {
      // Importación dinámica en el evento click — nunca se ejecuta en el servidor
      const [{ pdf }, { ReportePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ReportePDF"),
      ]);

      const blob = await pdf(React.createElement(ReportePDF, { data }) as any).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error generando PDF:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      className="gap-2 bg-finca-green-600 hover:bg-finca-green-700 disabled:opacity-70 min-w-[200px]"
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Generando PDF...</>
      ) : error ? (
        <><AlertTriangle className="w-4 h-4" /> Error — Reintentar</>
      ) : (
        <><FileDown className="w-4 h-4" /> Descargar Reporte PDF</>
      )}
    </Button>
  );
}
