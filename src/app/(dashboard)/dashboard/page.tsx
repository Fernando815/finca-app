import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";
async function getDashboardData(userId: string, fincaId: string) {
  const hoy = new Date();
  const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    finca, totalAnimales, animalesEnfermos, animalesEnTratamiento,
    tareasHoy, tareasVencidas, potrerosSinRotar,
    proximasVacunas, cultivosActivos, notificaciones,
    animalesPorTipo, tareasPorEstado, lecheUltimos7, potreros,
  ] = await Promise.all([
    prisma.finca.findFirst({ where: { userId, id: fincaId } }),
    prisma.animal.count({ where: { fincaId, estado: "ACTIVO" } }),
    prisma.animal.count({ where: { fincaId, estado: "ENFERMO" } }),
    prisma.animal.count({ where: { fincaId, estado: "EN_TRATAMIENTO" } }),
    prisma.tarea.findMany({
      where: {
        fincaId,
        estado: { in: ["PENDIENTE", "EN_PROCESO"] },
        fechaLimite: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      orderBy: { prioridad: "desc" },
    }),
    prisma.tarea.count({
      where: { fincaId, estado: "VENCIDA" },
    }),
    prisma.movimientoPotrero.findMany({
      where: { fechaSalida: null, potrero: { fincaId } },
      include: { lote: true, potrero: true },
    }),
    prisma.historialMedico.findMany({
      where: {
        animal: { fincaId },
        proximaFecha: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: { animal: { select: { codigo: true, nombre: true } } },
      orderBy: { proximaFecha: "asc" },
      take: 5,
    }),
    prisma.cultivo.count({ where: { parcela: { fincaId }, estado: "ACTIVO" } }),
    prisma.notificacion.findMany({
      where: { userId, leida: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Datos para gráficas
    prisma.animal.groupBy({
      by: ["tipo"],
      where: { fincaId },
      _count: { _all: true },
      orderBy: { _count: { tipo: "desc" } },
    }),
    prisma.tarea.groupBy({
      by: ["estado"],
      where: { fincaId },
      _count: { _all: true },
    }),
    prisma.registroLeche.findMany({
      where: { fincaId, fecha: { gte: hace7dias } },
      orderBy: { fecha: "asc" },
    }),
    prisma.potrero.findMany({
      where: { fincaId },
      select: { disponible: true },
    }),
  ]);

  // Calcular lotes que exceden días de ocupación
  const lotesAMover = potrerosSinRotar.filter((mov) => {
    const dias = Math.floor((Date.now() - new Date(mov.fechaEntrada).getTime()) / 86400000);
    return dias >= mov.potrero.diasOcupacionMaximo;
  });

  // Agrupar leche por día
  const lechePorDia: Record<string, number> = {};
  for (const r of lecheUltimos7) {
    const dia = new Date(r.fecha).toISOString().slice(0, 10);
    lechePorDia[dia] = (lechePorDia[dia] ?? 0) + r.litros;
  }
  const lecheChart = Object.entries(lechePorDia)
    .map(([fecha, litros]) => ({
      fechaLabel: new Date(fecha).toLocaleDateString("es-CR", { day: "2-digit", month: "short" }),
      litros,
    }))
    .sort((a, b) => a.fechaLabel.localeCompare(b.fechaLabel));

  return {
    finca,
    stats: {
      totalAnimales,
      animalesEnfermos,
      animalesEnTratamiento,
      tareasVencidas,
      cultivosActivos,
    },
    tareasHoy,
    lotesAMover,
    proximasVacunas,
    notificaciones,
    charts: {
      animalesPorTipo: animalesPorTipo.map(a => ({ tipo: a.tipo, total: a._count._all })),
      tareasPorEstado: tareasPorEstado.map(t => ({ estado: t.estado, total: t._count._all })),
      lecheChart,
      potreros: {
        disponibles: potreros.filter(p => p.disponible).length,
        ocupados:    potreros.filter(p => !p.disponible).length,
      },
    },
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const finca = await prisma.finca.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!finca) redirect("/setup");

  const data = await getDashboardData(session.user.id, finca.id);

  return <DashboardClient data={data} />;
}
