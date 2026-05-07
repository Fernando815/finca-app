"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface Finca { id: string; nombre: string; }

interface FincaContextValue {
  fincas: Finca[];
  fincaId: string;
  finca: Finca | null;
  setFincaId: (id: string) => void;
  loading: boolean;
}

const FincaContext = createContext<FincaContextValue>({
  fincas: [], fincaId: "", finca: null, setFincaId: () => {}, loading: true,
});

export function FincaProvider({ children }: { children: ReactNode }) {
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [fincaId, setFincaIdState] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fincas")
      .then(r => r.json())
      .then((data: Finca[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setFincas(data);
        const saved = typeof window !== "undefined" ? localStorage.getItem("fincaId") : null;
        const valid = saved && data.find(f => f.id === saved);
        setFincaIdState(valid ? saved! : data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const setFincaId = (id: string) => {
    setFincaIdState(id);
    localStorage.setItem("fincaId", id);
  };

  const finca = fincas.find(f => f.id === fincaId) ?? null;

  return (
    <FincaContext.Provider value={{ fincas, fincaId, finca, setFincaId, loading }}>
      {children}
    </FincaContext.Provider>
  );
}

export const useFinca = () => useContext(FincaContext);
