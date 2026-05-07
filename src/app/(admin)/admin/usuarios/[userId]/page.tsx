import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, MapPin, Beef, CheckSquare, Users, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AdminUsuarioPage({ params }: { params: { userId: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (me?.role !== "ADMIN") redirect("/dashboard");

  const usuario = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      suscripcion: true,
      fincas: {
        include: {
          _count: {
            select: {
              animales: true,
              potreros: true,
              lotes: true,
              tareas: true,
              peones: true,
              inventario: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  }) as any;

  if (!usuario) notFound();

  // Para cada finca, traer datos recientes
  const fincasDetalle = await Promise.all(
    (usuario.fincas as any[]).map(async (f: any) => {
      const [animalesEnfermos, tareasVencidas, animalesRecientes] = await Promise.all([
        prisma.animal.count({ where: { fincaId: f.id, estado: { in: ["ENFERMO", "EN_TRATAMIENTO"] } } }),
        prisma.tarea.count({ where: { fincaId: f.id, estado: "VENCIDA" } }),
        prisma.animal.findMany({ where: { fincaId: f.id }, orderBy: { createdAt: "desc" }, take: 5, select: { codigo: true, nombre: true, tipo: true, estado: true } }),
      ]);
      return { ...f, animalesEnfermos, tareasVencidas, animalesRecientes };
    })
  );

  const estadoColor: Record<string, string> = {
    ACTIVA: "bg-green-100 text-green-700", PRUEBA: "bg-blue-100 text-blue-700",
    VENCIDA: "bg-red-100 text-red-700", CANCELADA: "bg-stone-100 text-stone-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-stone-400 hover:text-stone-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-stone-900">{usuario.name ?? "Sin nombre"}</h2>
          <p className="text-stone-400 text-sm">{usuario.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-xs ${usuario.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-stone-100 text-stone-600"}`}>
            {usuario.role === "ADMIN" ? "👑 Admin" : "🌾 Productor"}
          </Badge>
          {usuario.suscripcion && (
            <Badge className={`text-xs ${estadoColor[usuario.suscripcion.estado] ?? ""}`}>
              {usuario.suscripcion.estado} · {usuario.suscripcion.plan}
            </Badge>
          )}
        </div>
      </div>

      {/* Info usuario */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Fincas",    value: usuario.fincas.length, icon: MapPin,      color: "text-green-600",  bg: "bg-green-50" },
          { label: "Registrado", value: format(new Date(usuario.createdAt), "d MMM yy", { locale: es }), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Plan",      value: usuario.suscripcion?.plan ?? "—",  icon: Package,    color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Vencimiento", value: usuario.suscripcion?.fechaVencimiento
            ? format(new Date(usuario.suscripcion.fechaVencimiento), "d MMM yy", { locale: es }) : "—",
            icon: CheckSquare, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`font-bold ${s.color} truncate`}>{s.value}</p>
              <p className="text-[11px] text-stone-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Fincas */}
      {fincasDetalle.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center">
          <MapPin className="w-8 h-8 text-stone-200 mx-auto mb-2" />
          <p className="text-stone-400 text-sm">Este usuario no tiene fincas registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-stone-800">Fincas ({fincasDetalle.length})</h3>
          {fincasDetalle.map(f => (
            <div key={f.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              {/* Finca header */}
              <div className="p-4 border-b border-stone-50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-stone-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500" /> {f.nombre}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {f.ubicacion ?? "Sin ubicación"} · Creada {format(new Date(f.createdAt), "d MMM yy", { locale: es })}
                  </p>
                </div>
                <Badge className="text-xs bg-stone-100 text-stone-600">{f.enfoque}</Badge>
              </div>

              {/* Conteos */}
              <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-stone-50">
                {[
                  { label: "Animales", value: f._count.animales,  icon: Beef,        alert: f.animalesEnfermos > 0, alertMsg: `${f.animalesEnfermos} enfermos` },
                  { label: "Potreros", value: f._count.potreros,  icon: MapPin,      alert: false },
                  { label: "Lotes",    value: f._count.lotes,     icon: Users,       alert: false },
                  { label: "Tareas",   value: f._count.tareas,    icon: CheckSquare, alert: f.tareasVencidas > 0, alertMsg: `${f.tareasVencidas} vencidas` },
                  { label: "Peones",   value: f._count.peones,    icon: Users,       alert: false },
                ].map(c => (
                  <div key={c.label} className="p-3 text-center">
                    <p className={`text-lg font-bold ${c.alert ? "text-red-600" : "text-stone-700"}`}>{c.value}</p>
                    <p className="text-[10px] text-stone-400">{c.label}</p>
                    {c.alert && <p className="text-[9px] text-red-500 font-medium">{c.alertMsg}</p>}
                  </div>
                ))}
              </div>

              {/* Últimos animales */}
              {f.animalesRecientes.length > 0 && (
                <div className="px-4 pb-4 pt-2">
                  <p className="text-xs font-medium text-stone-500 mb-2">Últimos animales registrados</p>
                  <div className="flex flex-wrap gap-2">
                    {f.animalesRecientes.map((a: any) => (
                      <span key={a.codigo} className="text-[11px] bg-stone-50 border border-stone-100 rounded-lg px-2 py-1 text-stone-600">
                        #{a.codigo} {a.nombre ? `· ${a.nombre}` : ""} · {a.tipo}
                        {(a.estado === "ENFERMO" || a.estado === "EN_TRATAMIENTO") && (
                          <span className="ml-1 text-red-500">⚠️</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
