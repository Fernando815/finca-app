import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { historialMedicoSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const animalId = new URL(req.url).searchParams.get("animalId");
  if (!animalId) return NextResponse.json({ error: "animalId requerido" }, { status: 400 });

  const historial = await prisma.historialMedico.findMany({
    where: { animalId, animal: { finca: { userId: session.user.id } } },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(historial);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await req.json();
  const parsed = historialMedicoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const animal = await prisma.animal.findFirst({
    where: { id: parsed.data.animalId, finca: { userId: session.user.id } },
  });
  if (!animal) return NextResponse.json({ error: "Animal no encontrado" }, { status: 404 });

  // Si el animal estaba ACTIVO y se registra medicamento, cambiar a EN_TRATAMIENTO
  if (["MEDICAMENTO", "CIRUGIA"].includes(parsed.data.tipo) && animal.estado === "ACTIVO") {
    await prisma.animal.update({ where: { id: animal.id }, data: { estado: "EN_TRATAMIENTO" } });
  }

  const registro = await prisma.historialMedico.create({ data: parsed.data as any });
  return NextResponse.json(registro, { status: 201 });
}
