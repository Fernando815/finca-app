import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { potreroSchema } from "@/lib/validations";

// Crea notificación solo si no existe una igual en las últimas 24h
async function upsertNotif(userId: string, tipo: string, titulo: string, mensaje: string, accion?: string) {
  const hace24h = new Date(Date.now() - 86400000);
  const existe = await prisma.notificacion.findFirst({
    where: { userId, tipo, mensaje, createdAt: { gte: hace24h } },
  });
  if (!existe) {
    await prisma.notificacion.create({ data: { userId, tipo, titulo, mensaje, accion } });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const userId = session.user.id;

  const fincaId = new URL(req.url).searchParams.get("fincaId");
  if (!fincaId) return NextResponse.json({ error: "fincaId requerido" }, { status: 400 });

  const potreros = await prisma.potrero.findMany({
    where: { fincaId, finca: { userId } },
    include: {
      movimientos: {
        where: { fechaSalida: null },
        include: { lote: { include: { animales: { select: { id: true } } } } },
        orderBy: { fechaEntrada: "desc" },
        take: 1,
      },
    },
    orderBy: { numero: "asc" },
  });

  // Auto-recuperar potreros que ya cumplieron su descanso
  const autoActualizar: Promise<any>[] = [];
  for (const p of potreros) {
    if (p.estadoPasto === "DESCANSANDO" && p.movimientos.length === 0) {
      const ultimoMov = await prisma.movimientoPotrero.findFirst({
        where: { potreroId: p.id, fechaSalida: { not: null } },
        orderBy: { fechaSalida: "desc" },
      });
      if (ultimoMov?.fechaSalida) {
        const diasDescansando = Math.floor(
          (Date.now() - new Date(ultimoMov.fechaSalida).getTime()) / 86400000
        );
        if (diasDescansando >= p.diasDescansoMinimo) {
          autoActualizar.push(
            prisma.potrero.update({ where: { id: p.id }, data: { estadoPasto: "EXCELENTE" } })
          );
          (p as any).estadoPasto = "EXCELENTE";
        }
        (p as any).diasDescansando = diasDescansando;
      }
    }
  }
  if (autoActualizar.length > 0) await Promise.all(autoActualizar);

  // Enriquecer con dias actuales, notificaciones automaticas y estado de rotacion
  const enriquecidos = await Promise.all(potreros.map(async (p) => {
    const movActual = p.movimientos[0] ?? null;
    const diasActual = movActual
      ? Math.floor((Date.now() - new Date(movActual.fechaEntrada).getTime()) / 86400000)
      : null;

    const necesitaRotacion = diasActual !== null && diasActual >= p.diasOcupacionMaximo;

    // Auto-generar notificacion cuando el lote supera el limite de dias
    if (necesitaRotacion && movActual) {
      await upsertNotif(
        userId,
        "ROTACION",
        "Rotacion pendiente",
        `Lote "${(movActual.lote as any)?.nombre}" lleva ${diasActual} dias en ${p.nombre} - debe rotar`,
        "/potreros"
      );
    }

    // Si esta descansando, calcular dias de descanso
    let diasDescansando: number | null = (p as any).diasDescansando ?? null;
    if ((p as any).estadoPasto === "DESCANSANDO" && !movActual && diasDescansando === null) {
      const ultimoMov = await prisma.movimientoPotrero.findFirst({
        where: { potreroId: p.id, fechaSalida: { not: null } },
        orderBy: { fechaSalida: "desc" },
      });
      if (ultimoMov?.fechaSalida) {
        diasDescansando = Math.floor(
          (Date.now() - new Date(ultimoMov.fechaSalida).getTime()) / 86400000
        );
      }
    }

    return { ...p, movActual, diasActual, diasDescansando, necesitaRotacion };
  }));

  return NextResponse.json(enriquecidos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await req.json();
  const parsed = potreroSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const potrero = await prisma.potrero.create({ data: parsed.data });
  return NextResponse.json(potrero, { status: 201 });
}
