import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { potreroSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const fincaId = new URL(req.url).searchParams.get("fincaId");
  if (!fincaId) return NextResponse.json({ error: "fincaId requerido" }, { status: 400 });

  const potreros = await prisma.potrero.findMany({
    where: { fincaId, finca: { userId: session.user.id } },
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
      // Buscar cuándo salió el último lote
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
            prisma.potrero.update({
              where: { id: p.id },
              data: { estadoPasto: "EXCELENTE" },
            })
          );
          (p as any).estadoPasto = "EXCELENTE";
        }
        (p as any).diasDescansando = diasDescansando;
      }
    }
  }
  if (autoActualizar.length > 0) await Promise.all(autoActualizar);

  // Enriquecer con días actuales y estado de rotación
  const enriquecidos = await Promise.all(potreros.map(async (p) => {
    const movActual = p.movimientos[0] ?? null;
    const diasActual = movActual
      ? Math.floor((Date.now() - new Date(movActual.fechaEntrada).getTime()) / 86400000)
      : null;

    // Si está descansando, calcular días de descanso
    let diasDescansando: number | null = null;
    if ((p as any).estadoPasto === "DESCANSANDO" && !movActual) {
      diasDescansando = (p as any).diasDescansando ?? null;
      if (diasDescansando === null) {
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
    }

    return {
      ...p,
      movActual,
      diasActual,
      diasDescansando,
      necesitaRotacion: diasActual !== null && diasActual >= p.diasOcupacionMaximo,
    };
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
