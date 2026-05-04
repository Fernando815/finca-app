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

  // Enriquecer con días actuales y estado de rotación
  const enriquecidos = potreros.map((p) => {
    const movActual = p.movimientos[0] ?? null;
    const diasActual = movActual
      ? Math.floor((Date.now() - new Date(movActual.fechaEntrada).getTime()) / 86400000)
      : null;
    return {
      ...p,
      movActual,
      diasActual,
      necesitaRotacion: diasActual !== null && diasActual >= p.diasOcupacionMaximo,
    };
  });

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
