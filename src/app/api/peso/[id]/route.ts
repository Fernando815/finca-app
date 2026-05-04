import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const METODOS = ["BASCULA", "ESTIMADO", "CINTA"] as const;

const updateSchema = z.object({
  fecha:  z.string().datetime().optional(),
  pesoKg: z.number().positive().optional(),
  metodo: z.enum(METODOS).optional(),
  notas:  z.string().optional().nullable(),
});

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const registro = await prisma.registroPeso.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!registro) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }); }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const data: any = { ...parsed.data };
  if (data.fecha) data.fecha = new Date(data.fecha);

  try {
    const updated = await prisma.registroPeso.update({ where: { id: params.id }, data });
    await syncPesoAnimal(registro.animalId);
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un registro de peso para este animal en esta fecha" }, { status: 409 });
    }
    console.error("[PUT /api/peso/[id]]", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const registro = await prisma.registroPeso.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!registro) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });

  await prisma.registroPeso.delete({ where: { id: params.id } });
  await syncPesoAnimal(registro.animalId);
  return NextResponse.json({ success: true });
}
