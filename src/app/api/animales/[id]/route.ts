import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { animalSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const animal = await prisma.animal.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
    include: {
      lote: true,
      historialMedico: { orderBy: { fecha: "desc" } },
      celos:           { orderBy: { fecha: "desc" } },
      partos:          { orderBy: { fecha: "desc" } },
      finca:           { select: { id: true, nombre: true } },
    },
  });

  if (!animal) return NextResponse.json({ error: "Animal no encontrado" }, { status: 404 });
  return NextResponse.json(animal);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await req.json();
  const parsed = animalSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const animal = await prisma.animal.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!animal) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.animal.update({ where: { id: params.id }, data: parsed.data as any });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const animal = await prisma.animal.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!animal) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.animal.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
