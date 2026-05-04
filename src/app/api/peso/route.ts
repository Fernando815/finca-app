import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const METODOS = ["BASCULA", "ESTIMADO", "CINTA"] as const;

const registroPesoSchema = z.object({
  animalId: z.string().min(1),
  fecha:    z.string().datetime(),
  pesoKg:   z.number().positive(),
  metodo:   z.enum(METODOS).default("BASCULA"),
  notas:    z.string().optional(),
});

// Actualiza Animal.pesoEstimado con el peso más reciente del animal
async function syncPesoAnimal(animalId: string) {
  const ultimo = await prisma.registroPeso.findFirst({
    where:   { animalId },
    orderBy: { fecha: "desc" },
    select:  { pesoKg: true },
  });
  await prisma.animal.update({
    where: { id: animalId },
    data:  { pesoEstimado: ultimo?.pesoKg ?? null },
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const animalId = searchParams.get("animalId");
  const fincaId  = searchParams.get("fincaId");

  if (!animalId && !fincaId) {
    return NextResponse.json({ error: "animalId o fincaId requerido" }, { status: 400 });
  }

  const registros = await prisma.registroPeso.findMany({
    where: {
      ...(animalId ? { animalId } : {}),
      ...(fincaId  ? { fincaId  } : {}),
      finca: { userId: session.user.id },
    },
    include: { animal: { select: { id: true, codigo: true, nombre: true } } },
    orderBy: { fecha: "asc" },
  });

  return NextResponse.json(registros);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }); }

  const parsed = registroPesoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { animalId, fecha, pesoKg, metodo, notas } = parsed.data;

  // Verificar que el animal pertenece a una finca del usuario y obtener fincaId
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, finca: { userId: session.user.id } },
    select: { id: true, fincaId: true },
  });
  if (!animal) return NextResponse.json({ error: "Animal no encontrado" }, { status: 404 });

  try {
    const registro = await prisma.registroPeso.create({
      data: { animalId, fincaId: animal.fincaId, fecha: new Date(fecha), pesoKg, metodo, notas },
      include: { animal: { select: { id: true, codigo: true, nombre: true } } },
    });

    // Sincronizar pesoEstimado del animal
    await syncPesoAnimal(animalId);

    return NextResponse.json(registro, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un registro de peso para este animal en esta fecha" }, { status: 409 });
    }
    console.error("[POST /api/peso]", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
