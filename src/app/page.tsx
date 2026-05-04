import Link from "next/link";
import { CheckCircle2, Leaf, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { emoji: "🐄", title: "Gestión de Ganado",       desc: "Registro individual, historial médico, vacunas, partos y celos en un solo lugar." },
  { emoji: "🌿", title: "Rotación de Potreros",    desc: "Calcula días de rotación, alertas automáticas y historial de movimientos de lotes." },
  { emoji: "🌱", title: "Cultivos",                desc: "Administra café, plátano, yuca y más. Control de labores y etapas de cada cultivo." },
  { emoji: "🔔", title: "Alertas y Recordatorios", desc: "Notificaciones push para vacunas, desparasitaciones, partos y tareas vencidas." },
  { emoji: "📊", title: "Dashboard Central",       desc: "Todo lo importante al abrir la app: tareas del día, animales en tratamiento y lotes a mover." },
  { emoji: "✅", title: "Tareas de Finca",         desc: "Crea, asigna y da seguimiento a las tareas diarias, semanales y mensuales de la finca." },
];

const planes = [
  {
    nombre: "Gratuito",
    precio: "$0",
    periodo: "para siempre",
    features: ["1 finca", "50 animales", "Tareas básicas", "Dashboard"],
    cta: "Empezar gratis",
    href: "/register",
    highlight: false,
  },
  {
    nombre: "Básico",
    precio: "$9.99",
    periodo: "/ mes",
    features: ["3 fincas", "200 animales", "Croquis de finca", "Notificaciones push", "Rotación automática", "Soporte email"],
    cta: "Comenzar prueba",
    href: "/register?plan=basico",
    highlight: true,
  },
  {
    nombre: "Pro",
    precio: "$19.99",
    periodo: "/ mes",
    features: ["Fincas ilimitadas", "Animales ilimitados", "Reportes avanzados", "Multi-usuario", "Exportar datos", "Soporte prioritario"],
    cta: "Ir al Pro",
    href: "/register?plan=pro",
    highlight: false,
  },
];

const testimonios = [
  { nombre: "Carlos Vargas", finca: "Finca Las Palmas, Alajuela", texto: "Con FincaApp organicé la rotación de mis 8 potreros y ya no pierdo animales por descuido. Es muy fácil de usar.", estrellas: 5 },
  { nombre: "María Rodríguez", finca: "Finca El Cafetal, Pérez Zeledón", texto: "El control de mis cultivos de café mejoró mucho. Las alertas de fertilización me ahorran tiempo.", estrellas: 5 },
  { nombre: "José Méndez", finca: "Ganadería San Juan, San Carlos", texto: "Nunca pensé que una app pudiera ayudarme tanto con el ganado. El historial médico es invaluable.", estrellas: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-finca-green-500 to-finca-green-700 rounded-xl flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-stone-900">FincaApp</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-stone-500">
            <Link href="#features" className="hover:text-stone-800 transition-colors">Funciones</Link>
            <Link href="#precios" className="hover:text-stone-800 transition-colors">Precios</Link>
            <Link href="#testimonios" className="hover:text-stone-800 transition-colors">Testimonios</Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Registrarse gratis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-finca-green-900 via-finca-green-800 to-finca-green-700 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-80 h-80 bg-finca-green-400/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8 backdrop-blur-sm">
            🇨🇷 Hecho para productores de Costa Rica
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Organiza tu finca.<br />
            <span className="text-finca-green-200">Trabaja con más orden.</span>
          </h1>

          <p className="text-lg md:text-xl text-green-100/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gestión de ganado, rotación de potreros, cultivos, tareas y recordatorios —
            todo en una app sencilla pensada para el productor real.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" className="bg-white text-finca-green-800 hover:bg-green-50 font-semibold shadow-lg" asChild>
              <Link href="/register">
                Empezar gratis <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="xl" variant="ghost" className="text-white border border-white/30 hover:bg-white/10" asChild>
              <Link href="/login">Ver demo →</Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 border-t border-white/10 pt-10">
            {[
              { num: "500+", label: "Fincas registradas" },
              { num: "12,000+", label: "Animales gestionados" },
              { num: "98%", label: "Satisfacción de usuarios" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-white">{s.num}</p>
                <p className="text-xs text-green-200/70 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-finca-green-600 bg-finca-green-50 border border-finca-green-100 px-3 py-1 rounded-full mb-3">
              Funcionalidades
            </span>
            <h2 className="text-3xl font-bold text-stone-900 mb-3">Todo lo que necesita su finca</h2>
            <p className="text-stone-500 max-w-xl mx-auto text-sm leading-relaxed">
              Desde el registro del primer ternero hasta la rotación del último potrero, FincaApp tiene todo.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-11 h-11 bg-finca-green-50 rounded-xl flex items-center justify-center mb-4 text-xl">
                  {f.emoji}
                </div>
                <h3 className="font-semibold text-stone-900 mb-2 text-sm">{f.title}</h3>
                <p className="text-stone-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonios ─────────────────────────────────────── */}
      <section id="testimonios" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
              Testimonios
            </span>
            <h2 className="text-3xl font-bold text-stone-900">Lo que dicen los productores</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonios.map((t) => (
              <div key={t.nombre} className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.estrellas }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-stone-600 leading-relaxed mb-4">"{t.texto}"</p>
                <div>
                  <p className="text-xs font-semibold text-stone-800">{t.nombre}</p>
                  <p className="text-[11px] text-stone-400">{t.finca}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planes ──────────────────────────────────────────── */}
      <section id="precios" className="py-20 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-finca-green-600 bg-finca-green-50 border border-finca-green-100 px-3 py-1 rounded-full mb-3">
              Precios
            </span>
            <h2 className="text-3xl font-bold text-stone-900 mb-3">Planes y precios</h2>
            <p className="text-stone-500 text-sm">Empiece gratis, crezca cuando lo necesite.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {planes.map((p) => (
              <div key={p.nombre} className={`rounded-2xl p-6 flex flex-col border-2 transition-all ${
                p.highlight
                  ? "bg-finca-green-800 border-finca-green-700 text-white shadow-xl scale-[1.02]"
                  : "bg-white border-stone-100 shadow-card"
              }`}>
                {p.highlight && (
                  <span className="text-[11px] font-bold text-finca-green-700 bg-white px-3 py-1 rounded-full self-start mb-3">
                    ⭐ Más popular
                  </span>
                )}
                <h3 className={`text-lg font-bold mb-1 ${p.highlight ? "text-white" : "text-stone-900"}`}>
                  {p.nombre}
                </h3>
                <div className="mb-5">
                  <span className={`text-4xl font-extrabold ${p.highlight ? "text-white" : "text-stone-900"}`}>
                    {p.precio}
                  </span>
                  <span className={`text-sm ml-1 ${p.highlight ? "text-green-200" : "text-stone-400"}`}>
                    {p.periodo}
                  </span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${p.highlight ? "text-green-300" : "text-finca-green-600"}`} />
                      <span className={p.highlight ? "text-green-100" : "text-stone-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={p.highlight ? "bg-white text-finca-green-800 hover:bg-green-50 font-semibold" : ""}
                  variant={p.highlight ? "default" : "outline"}
                  asChild
                >
                  <Link href={p.href}>{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-br from-finca-green-800 to-finca-green-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl mb-4">🌿</div>
          <h2 className="text-3xl font-bold mb-4">¿Listo para organizar su finca?</h2>
          <p className="text-green-100 mb-8 text-sm leading-relaxed">
            Únase a cientos de productores costarricenses que ya usan FincaApp.
            Empiece hoy mismo, es completamente gratis.
          </p>
          <Button size="xl" className="bg-white text-finca-green-800 hover:bg-green-50 font-semibold shadow-lg" asChild>
            <Link href="/register">Crear cuenta gratis <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-stone-900 text-stone-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-finca-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">FincaApp</span>
          </div>
          <p className="text-xs text-center">
            Hecho con ❤️ para los productores agropecuarios de Costa Rica.
          </p>
          <p className="text-xs">© {new Date().getFullYear()} FincaApp</p>
        </div>
      </footer>
    </div>
  );
}

