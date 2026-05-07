import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { movimientoSchema } from "@/lib/validations";

// POST: Mover lote a nuevo potrero
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await req.json();
  const parsed = movimientoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { loteId, potreroId, fechaEntrada, motivo, notas } = parsed.data;

  // Verificar que lote y potrero pertenezcan al usuario
  const lote    = await prisma.lote.findFirst({ where: { id: loteId, finca: { userId: session.user.id } } });
  const potrero = await prisma.potrero.findFirst({ where: { id: potreroId, finca: { userId: session.user.id } } });
  if (!lote || !potrero) return NextResponse.json({ error: "Lote o potrero no encontrado" }, { status: 404 });

  // Verificar que el potrero destino no esté ya ocupado por OTRO lote
  const potreroOcupado = await prisma.movimientoPotrero.findFirst({
    where: { potreroId, fechaSalida: null },
  });
  if (potreroOcupado && potreroOcupado.loteId !== loteId) {
    return NextResponse.json(
      { error: "Este potrero ya está ocupado por otro lote. Debe rotarlo primero." },
      { status: 409 }
    );
  }

  // Cerrar TODOS los movimientos activos del lote (puede haber varios por datos de prueba)
  const movsActivos = await prisma.movimientoPotrero.findMany({
    where: { loteId, fechaSalida: null },
  });

  if (movsActivos.length > 0) {
    const fechaSalida = new Date(fechaEntrada);
    for (const mov of movsActivos) {
      const diasEnPotrero = Math.floor(
        (fechaSalida.getTime() - new Date(mov.fechaEntrada).getTime()) / 86400000
      );
      await prisma.movimientoPotrero.update({
        where: { id: mov.id },
        data: { fechaSalida, diasEnPotrero },
      });
      // Poner potrero anterior en estado DESCANSANDO (no bloqueado, solo alerta visual)
      if (mov.potreroId !== potreroId) {
        await prisma.potrero.update({
          where: { id: mov.potreroId },
          data: { estadoPasto: "DESCANSANDO", disponible: true },
        });
      }
    }
  }

  // Crear nuevo movimiento
  const nuevoMovimiento = await prisma.movimientoPotrero.create({
    data: { loteId, potreroId, fechaEntrada: new Date(fechaEntrada), motivo, notas },
    include: { lote: true, potrero: true },
  });

  // Marcar nuevo potrero como ocupado
  await prisma.potrero.update({ where: { id: potreroId }, data: { disponible: false } });

  return NextResponse.json(nuevoMovimiento, { status: 201 });
}

// GET: Historial de movimientos
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fincaId = searchParams.get("fincaId");
  const loteId  = searchParams.get("loteId");

  const movimientos = await prisma.movimientoPotrero.findMany({
    where: {
      ...(loteId ? { loteId } : {}),
      potrero: { ...(fincaId ? { fincaId } : {}), finca: { userId: session.user.id } },
    },
    include: { lote: true, potrero: true },
    orderBy: { fechaEntrada: "desc" },
    take: 50,
  });

  return NextResponse.json(movimientos);
}
