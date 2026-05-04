import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const celoSchema = z.object({
  animalId:    z.string().min(1),
  fecha:       z.coerce.date(),
  intensidad:  z.string().optional(),
  monta:       z.boolean().default(false),
  toro:        z.string().optional(),
  inseminacion:z.boolean().default(false),
  resultado:   z.string().optional(),
  notas:       z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const animalId = new URL(req.url).searchParams.get("animalId");
  if (!animalId) return NextResponse.json({ error: "animalId requerido" }, { status: 400 });

  const celos = await prisma.celo.findMany({
    where: { animalId, animal: { finca: { userId: session.user.id } } },
    orderBy: { fecha: "desc" },
  });
  return NextResponse.json(celos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await req.json();
  const parsed = celoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const animal = await prisma.animal.findFirst({
    where: { id: parsed.data.animalId, finca: { userId: session.user.id } },
  });
  if (!animal) return NextResponse.json({ error: "Animal no encontrado" }, { status: 404 });

  // Actualizar estado a EN_CELO
  await prisma.animal.update({ where: { id: animal.id }, data: { estado: "EN_CELO" } });

  const celo = await prisma.celo.create({ data: parsed.data as any });
  return NextResponse.json(celo, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  await prisma.celo.deleteMany({
    where: { id, animal: { finca: { userId: session.user.id } } },
  });
  return NextResponse.json({ ok: true });
}
