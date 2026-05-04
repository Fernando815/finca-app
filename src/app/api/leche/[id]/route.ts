import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  fecha:             z.string().datetime().optional(),
  litros:            z.number().positive().optional(),
  animalesOrdenados: z.number().int().positive().optional().nullable(),
  notas:             z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const registro = await prisma.registroLeche.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
    include: {
      animal: { select: { id: true, codigo: true, nombre: true } },
      lote:   { select: { id: true, nombre: true } },
    },
  });
  if (!registro) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });

  return NextResponse.json(registro);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const registro = await prisma.registroLeche.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!registro) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });

  const body   = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const data: any = { ...parsed.data };
  if (data.fecha) data.fecha = new Date(data.fecha);

  try {
    const updated = await prisma.registroLeche.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un registro para este animal/lote en esta fecha" }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const registro = await prisma.registroLeche.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!registro) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });

  await prisma.registroLeche.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
