import { Leaf } from "lucide-react";
import Link from "next/link";

const highlights = [
  { emoji: "🐄", text: "Gestión completa de ganado" },
  { emoji: "🌿", text: "Rotación automática de potreros" },
  { emoji: "🌱", text: "Control de cultivos y parcelas" },
  { emoji: "📊", text: "Dashboard con alertas en tiempo real" },
  { emoji: "🔔", text: "Notificaciones de vacunas y tareas" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — solo desktop */}
      <div className="hidden lg:flex w-[440px] flex-shrink-0 bg-gradient-to-br from-finca-green-900 via-finca-green-800 to-finca-green-700 flex-col justify-between p-10 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-finca-green-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">FincaApp</span>
        </Link>

        {/* Contenido central */}
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            La app que su finca<br />necesitaba
          </h2>
          <p className="text-green-200/80 text-sm leading-relaxed mb-8">
            Organice el ganado, los potreros, cultivos y tareas de su finca
            desde su celular. Simple, rápido y pensado para Costa Rica.
          </p>
          <ul className="space-y-3">
            {highlights.map(h => (
              <li key={h.text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 text-base">
                  {h.emoji}
                </div>
                <span className="text-sm text-green-100">{h.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-xs text-green-400/60 relative z-10">
          © {new Date().getFullYear()} FincaApp · Para productores de Costa Rica 🇨🇷
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 bg-stone-50 flex flex-col items-center justify-center p-6">
        {/* Logo mobile */}
        <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-finca-green-600 rounded-xl flex items-center justify-center shadow-sm">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-finca-green-800">FincaApp</span>
        </Link>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

