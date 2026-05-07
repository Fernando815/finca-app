"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

interface Finca { id: string; nombre: string; }

interface FincaContextValue {
  fincas: Finca[];
  fincaId: string;
  finca: Finca | null;
  setFincaId: (id: string) => void;
  reload: () => Promise<void>;
  loading: boolean;
}

const FincaContext = createContext<FincaContextValue>({
  fincas: [], fincaId: "", finca: null, setFincaId: () => {}, reload: async () => {}, loading: true,
});

export function FincaProvider({ children }: { children: ReactNode }) {
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [fincaId, setFincaIdState] = useState("");
  const [loading, setLoading] = useState(true);

  const loadFincas = useCallback(async () => {
    const data: Finca[] = await fetch("/api/fincas").then(r => r.json()).catch(() => []);
    if (!Array.isArray(data) || data.length === 0) { setLoading(false); return; }
    setFincas(data);
    const saved = typeof window !== "undefined" ? localStorage.getItem("fincaId") : null;
    const valid = saved && data.find(f => f.id === saved);
    const activeId = valid ? saved! : data[0].id;
    setFincaIdState(prev => prev || activeId);
    // Sincronizar cookie en carga inicial
    document.cookie = `finca-id=${activeId}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setLoading(false);
  }, []);

  useEffect(() => { loadFincas(); }, [loadFincas]);

  const setFincaId = (id: string) => {
    setFincaIdState(id);
    localStorage.setItem("fincaId", id);
    // Sincronizar con cookie para que páginas servidor la lean
    document.cookie = `finca-id=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  };

  const reload = async () => {
    const data: Finca[] = await fetch("/api/fincas").then(r => r.json()).catch(() => []);
    if (Array.isArray(data)) setFincas(data);
  };

  const finca = fincas.find(f => f.id === fincaId) ?? null;

  return (
    <FincaContext.Provider value={{ fincas, fincaId, finca, setFincaId, reload, loading }}>
      {children}
    </FincaContext.Provider>
  );
}

export const useFinca = () => useContext(FincaContext);
