import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Users, CreditCard, TrendingUp, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AdminUsersTable } from "./AdminUsersTable";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") redirect("/dashboard");

  const [totalUsers, totalFincas, suscripciones, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.finca.count(),
    prisma.suscripcion.groupBy({ by: ["estado"], _count: { _all: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        suscripcion: { select: { estado: true, plan: true, fechaVencimiento: true } },
        _count: { select: { fincas: true } },
      },
    }) as unknown as any[],
  ]);

  const activas = suscripciones.find(s => s.estado === "ACTIVA")?._count._all ?? 0;
  const prueba  = suscripciones.find(s => s.estado === "PRUEBA")?._count._all ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Panel de Administración</h2>
          <p className="text-stone-500 text-sm">Control global de usuarios y suscripciones</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Usuarios totales",      value: totalUsers,  icon: Users,       color: "text-blue-600",    bg: "bg-blue-50" },
          { label: "Fincas registradas",    value: totalFincas, icon: TrendingUp,  color: "text-green-600",   bg: "bg-green-50" },
          { label: "Suscripciones activas", value: activas,     icon: CreditCard,  color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "En período de prueba",  value: prueba,      icon: Shield,      color: "text-amber-600",   bg: "bg-amber-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabla interactiva de usuarios */}
      <AdminUsersTable users={recentUsers} currentUserId={session.user.id} />
    </div>
  );
}

