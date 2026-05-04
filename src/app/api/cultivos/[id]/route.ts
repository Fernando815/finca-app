import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function getCultivo(id: string, userId: string) {
  return prisma.cultivo.findFirst({
    where: { id, parcela: { finca: { userId } } },
    include: {
      parcela: { select: { id: true, nombre: true, fincaId: true } },
      labores: { orderBy: { fecha: "desc" } },
    },
  });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cultivo = await getCultivo(params.id, session.user.id);
  if (!cultivo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(cultivo);
}

const updateSchema = z.object({
  tipo:          z.string().optional(),
  variedad:      z.string().optional().nullable(),
  fechaSiembra:  z.coerce.date().optional().nullable(),
  fechaCosecha:  z.coerce.date().optional().nullable(),
  etapa:         z.string().optional(),
  estado:        z.string().optional(),
  areaHectareas: z.coerce.number().positive().optional().nullable(),
  notas:         z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cultivo = await getCultivo(params.id, session.user.id);
  if (!cultivo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body   = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const updated = await prisma.cultivo.update({ where: { id: params.id }, data: parsed.data as any });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cultivo = await getCultivo(params.id, session.user.id);
  if (!cultivo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.cultivo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
