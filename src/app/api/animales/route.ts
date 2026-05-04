import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { animalSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fincaId = searchParams.get("fincaId");
  const estado   = searchParams.get("estado");
  const tipo     = searchParams.get("tipo");
  const loteId   = searchParams.get("loteId");
  const q        = searchParams.get("q");

  if (!fincaId) return NextResponse.json({ error: "fincaId requerido" }, { status: 400 });

  const finca = await prisma.finca.findFirst({ where: { id: fincaId, userId: session.user.id } });
  if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

  const animales = await prisma.animal.findMany({
    where: {
      fincaId,
      ...(estado ? { estado: estado as any } : {}),
      ...(tipo   ? { tipo:   tipo as any   } : {}),
      ...(loteId ? { loteId }               : {}),
      ...(q ? { OR: [
        { codigo:  { contains: q } },
        { nombre:  { contains: q } },
        { raza:    { contains: q } },
      ]} : {}),
    },
    include: {
      lote: { select: { id: true, nombre: true } },
      _count: { select: { historialMedico: true, partos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(animales);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await req.json();
  const parsed = animalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const finca = await prisma.finca.findFirst({
    where: { id: parsed.data.fincaId, userId: session.user.id },
  });
  if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

  const animal = await prisma.animal.create({ data: parsed.data as any });
  return NextResponse.json(animal, { status: 201 });
}
