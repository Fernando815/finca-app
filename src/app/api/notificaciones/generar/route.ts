import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper: crear notificación solo si no existe una igual en las últimas 24h
async function upsertNotif(
  userId: string,
  tipo: string,
  titulo: string,
  mensaje: string,
  accion?: string
) {
  const hace24h = new Date(Date.now() - 86400000);
  const existe = await prisma.notificacion.findFirst({
    where: { userId, tipo, mensaje, createdAt: { gte: hace24h } },
  });
  if (!existe) {
    await prisma.notificacion.create({ data: { userId, tipo, titulo, mensaje, accion } });
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const userId = session.user.id;

  // Obtener fincas del usuario
  const fincas = await prisma.finca.findMany({ where: { userId }, select: { id: true } });
  const fincaIds = fincas.map(f => f.id);
  if (fincaIds.length === 0) return NextResponse.json({ ok: true, generadas: 0 });

  let generadas = 0;

  // 1. Lotes que necesitan rotación
  const movActivos = await prisma.movimientoPotrero.findMany({
    where: { fechaSalida: null, potrero: { fincaId: { in: fincaIds } } },
    include: { lote: { select: { nombre: true } }, potrero: { select: { nombre: true, diasOcupacionMaximo: true } } },
  });
  for (const mov of movActivos) {
    const dias = Math.floor((Date.now() - new Date(mov.fechaEntrada).getTime()) / 86400000);
    if (dias >= mov.potrero.diasOcupacionMaximo) {
      await upsertNotif(
        userId, "ROTACION", "Rotación pendiente",
        `Lote "${mov.lote.nombre}" lleva ${dias} días en ${mov.potrero.nombre} — debe rotar`,
        "/potreros"
      );
      generadas++;
    }
  }

  // 2. Animales enfermos o en tratamiento
  const animalesAlerta = await prisma.animal.findMany({
    where: { fincaId: { in: fincaIds }, estado: { in: ["ENFERMO", "EN_TRATAMIENTO"] } },
    select: { nombre: true, codigo: true, estado: true },
  });
  if (animalesAlerta.length > 0) {
    const enfermos = animalesAlerta.filter(a => a.estado === "ENFERMO").length;
    const tratamiento = animalesAlerta.filter(a => a.estado === "EN_TRATAMIENTO").length;
    if (enfermos > 0) {
      await upsertNotif(userId, "SISTEMA", "Animales enfermos",
        `${enfermos} animal(es) con estado ENFERMO requieren atención`, "/animales");
      generadas++;
    }
    if (tratamiento > 0) {
      await upsertNotif(userId, "VACUNA", "Animales en tratamiento",
        `${tratamiento} animal(es) están en tratamiento activo`, "/animales");
      generadas++;
    }
  }

  // 3. Tareas vencidas
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const tareasVencidas = await prisma.tarea.count({
    where: {
      fincaId: { in: fincaIds },
      estado: { in: ["PENDIENTE", "EN_PROCESO"] },
      fechaLimite: { lt: hoy },
    },
  });
  if (tareasVencidas > 0) {
    await upsertNotif(userId, "TAREA", "Tareas vencidas",
      `Tienes ${tareasVencidas} tarea(s) vencida(s) sin completar`, "/tareas");
    generadas++;
  }

  // 4. Próximas vacunas (historialMedico con proximaFecha en 7 días)
  const en7dias = new Date(Date.now() + 7 * 86400000);
  const vacunasPendientes = await prisma.historialMedico.findMany({
    where: {
      animal: { fincaId: { in: fincaIds } },
      proximaFecha: { lte: en7dias, gte: new Date() },
      tipo: { in: ["VACUNA", "DESPARASITANTE", "VITAMINA"] },
    },
    include: { animal: { select: { nombre: true, codigo: true } } },
    take: 5,
  });
  for (const v of vacunasPendientes) {
    const nombre = v.animal.nombre ?? `#${v.animal.codigo}`;
    const fecha = v.proximaFecha!.toLocaleDateString("es-CR", { day: "numeric", month: "short" });
    await upsertNotif(
      userId, "VACUNA", "Vacuna próxima",
      `${v.tipo.toLowerCase()} de ${nombre} programada para el ${fecha}`,
      "/animales"
    );
    generadas++;
  }

  return NextResponse.json({ ok: true, generadas });
}
