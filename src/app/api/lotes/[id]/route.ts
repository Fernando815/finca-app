import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function getLote(id: string, userId: string) {
  return prisma.lote.findFirst({
    where: { id, finca: { userId } },
    include: {
      animales: { select: { id: true, codigo: true, nombre: true, tipo: true, estado: true } },
      movimientos: {
        include: { potrero: { select: { id: true, nombre: true } } },
        orderBy: { fechaEntrada: "desc" },
        take: 10,
      },
    },
  });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const lote = await getLote(params.id, session.user.id);
  if (!lote) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(lote);
}

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional().nullable(),
  tipo: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const lote = await getLote(params.id, session.user.id);
  if (!lote) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  const updated = await prisma.lote.update({ where: { id: params.id }, data: parsed.data as any });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const lote = await getLote(params.id, session.user.id);
  if (!lote) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await prisma.lote.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
