import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReportesClient from "./ReportesClient";

export default async function ReportesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const finca = await prisma.finca.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!finca) redirect("/dashboard");

  const hoy = new Date();
  const en7dias = new Date(hoy);
  en7dias.setDate(en7dias.getDate() + 7);

  const [
    totalAnimales, animalesPorEstado, animalesPorTipo,
    totalCultivos, cultivosPorTipo,
    totalTareas, tareasPorEstado, tareasProximas, tareasVencidas,
    totalPotreros, potreros,
    laboresRecientes, movimientosRecientes,
    totalPeones, peonesPorEstado,
    inventarioItems,
    // Datos detallados para PDF
    animalesLista,
    tareasLista,
    peonesLista,
    cultivosLista,
    historialReciente,
  ] = await Promise.all([
    prisma.animal.count({ where: { fincaId: finca.id } }),
    prisma.animal.groupBy({ by: ["estado"], where: { fincaId: finca.id }, _count: { _all: true } }),
    prisma.animal.groupBy({ by: ["tipo"], where: { fincaId: finca.id }, _count: { _all: true } }),
    prisma.cultivo.count({ where: { parcela: { fincaId: finca.id } } }),
    prisma.cultivo.groupBy({ by: ["tipo"], where: { parcela: { fincaId: finca.id } }, _count: { _all: true } }),
    prisma.tarea.count({ where: { fincaId: finca.id } }),
    prisma.tarea.groupBy({ by: ["estado"], where: { fincaId: finca.id }, _count: { _all: true } }),
    prisma.tarea.findMany({
      where: { fincaId: finca.id, estado: { in: ["PENDIENTE", "EN_PROCESO"] }, fechaLimite: { gte: hoy, lte: en7dias } },
      include: { peon: { select: { nombre: true } } },
      orderBy: { fechaLimite: "asc" },
      take: 15,
    }),
    prisma.tarea.findMany({
      where: { fincaId: finca.id, estado: "VENCIDA" },
      include: { peon: { select: { nombre: true } } },
      orderBy: { fechaLimite: "asc" },
      take: 20,
    }),
    prisma.potrero.count({ where: { fincaId: finca.id } }),
    prisma.potrero.findMany({
      where: { fincaId: finca.id },
      include: {
        movimientos: {
          where: { fechaSalida: null },
          include: { lote: { select: { nombre: true } } },
          take: 1,
          orderBy: { fechaEntrada: "desc" },
        },
      },
    }),
    prisma.laborAgricola.findMany({
      where: { cultivo: { parcela: { fincaId: finca.id } } },
      include: { cultivo: { select: { tipo: true } } },
      orderBy: { fecha: "desc" },
      take: 20,
    }),
    prisma.movimientoPotrero.findMany({
      where: { potrero: { fincaId: finca.id } },
      include: { lote: { select: { nombre: true } }, potrero: { select: { nombre: true } } },
      orderBy: { fechaEntrada: "desc" },
      take: 20,
    }),
    prisma.peon.count({ where: { fincaId: finca.id } }),
    prisma.peon.groupBy({ by: ["estado"], where: { fincaId: finca.id }, _count: { _all: true } }),
    prisma.inventarioItem.findMany({
      where: { fincaId: finca.id, estado: { not: "DADO_DE_BAJA" } },
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    }),
    // Detalles para PDF
    prisma.animal.findMany({
      where: { fincaId: finca.id },
      orderBy: [{ tipo: "asc" }, { codigo: "asc" }],
    }),
    prisma.tarea.findMany({
      where: { fincaId: finca.id },
      include: { peon: { select: { nombre: true } } },
      orderBy: [{ estado: "asc" }, { prioridad: "desc" }, { fechaLimite: "asc" }],
      take: 200,
    }),
    prisma.peon.findMany({
      where: { fincaId: finca.id },
      orderBy: { nombre: "asc" },
    }),
    prisma.cultivo.findMany({
      where: { parcela: { fincaId: finca.id } },
      include: { parcela: { select: { nombre: true } } },
      orderBy: [{ tipo: "asc" }],
    }),
    prisma.historialMedico.findMany({
      where: { animal: { fincaId: finca.id } },
      include: { animal: { select: { nombre: true, codigo: true } } },
      orderBy: { fecha: "desc" },
      take: 50,
    }),
  ]);

  // Calcular alertas de inventario
  const stockBajo = inventarioItems.filter((i: any) => i.cantidadMinima != null && i.cantidad < i.cantidadMinima);
  const mantVencido = inventarioItems.filter((i: any) => i.proximoMantenimiento && new Date(i.proximoMantenimiento) < hoy);
  const mantProximo = inventarioItems.filter((i: any) => {
    if (!i.proximoMantenimiento) return false;
    const d = new Date(i.proximoMantenimiento);
    return d >= hoy && d <= en7dias;
  });

  // Serializar: JSON convierte Date → string, previene errores de hidratación
  const serialize = (obj: unknown) => JSON.parse(JSON.stringify(obj));

  return <ReportesClient data={serialize({
    finca, hoy: hoy.toISOString(),
    totalAnimales, animalesPorEstado, animalesPorTipo,
    totalCultivos, cultivosPorTipo,
    totalTareas, tareasPorEstado, tareasProximas, tareasVencidas,
    totalPotreros, potreros,
    laboresRecientes, movimientosRecientes,
    totalPeones, peonesPorEstado,
    totalInventario: inventarioItems.length,
    stockBajo, mantVencido, mantProximo,
    animalesLista,
    tareasLista,
    peonesLista,
    cultivosLista,
    inventarioLista: inventarioItems,
    historialReciente,
  })} />;
}
