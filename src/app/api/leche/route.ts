import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registroLecheSchema = z.object({
  fincaId:           z.string().min(1),
  fecha:             z.string().datetime(),
  litros:            z.number().positive(),
  animalesOrdenados: z.number().int().positive().optional(),
  notas:             z.string().optional(),
  animalId:          z.string().optional(),
  loteId:            z.string().optional(),
}).refine(
  (d) => Boolean(d.animalId) !== Boolean(d.loteId),
  { message: "Debe especificar un animal O un lote, no ambos ni ninguno" }
);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fincaId  = searchParams.get("fincaId");
  const animalId = searchParams.get("animalId");
  const loteId   = searchParams.get("loteId");
  const desde    = searchParams.get("desde");
  const hasta    = searchParams.get("hasta");

  if (!fincaId) return NextResponse.json({ error: "fincaId requerido" }, { status: 400 });

  const registros = await prisma.registroLeche.findMany({
    where: {
      fincaId,
      finca: { userId: session.user.id },
      ...(animalId ? { animalId } : {}),
      ...(loteId   ? { loteId   } : {}),
      ...(desde || hasta ? {
        fecha: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(hasta ? { lte: new Date(hasta) } : {}),
        },
      } : {}),
    },
    include: {
      animal: { select: { id: true, codigo: true, nombre: true } },
      lote:   { select: { id: true, nombre: true } },
    },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(registros);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const parsed = registroLecheSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { fincaId, animalId, loteId, ...rest } = parsed.data;

  // Verificar que la finca pertenece al usuario
  const finca = await prisma.finca.findFirst({ where: { id: fincaId, userId: session.user.id } });
  if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

  // Verificar que el animal/lote pertenece a la misma finca
  if (animalId) {
    const animal = await prisma.animal.findFirst({ where: { id: animalId, fincaId } });
    if (!animal) return NextResponse.json({ error: "Animal no encontrado en esta finca" }, { status: 404 });
  }
  if (loteId) {
    const lote = await prisma.lote.findFirst({ where: { id: loteId, fincaId } });
    if (!lote) return NextResponse.json({ error: "Lote no encontrado en esta finca" }, { status: 404 });
  }

  try {
    const registro = await prisma.registroLeche.create({
      data: { fincaId, animalId, loteId, ...rest, fecha: new Date(rest.fecha) },
      include: {
        animal: { select: { id: true, codigo: true, nombre: true } },
        lote:   { select: { id: true, nombre: true } },
      },
    });
    return NextResponse.json(registro, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un registro para este animal/lote en esta fecha" }, { status: 409 });
    }
    console.error("[POST /api/leche]", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
