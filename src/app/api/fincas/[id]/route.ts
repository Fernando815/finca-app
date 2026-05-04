import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  nombre:        z.string().min(1).optional(),
  descripcion:   z.string().optional().nullable(),
  ubicacion:     z.string().optional().nullable(),
  areaTotal:     z.coerce.number().positive().optional().nullable(),
  enfoque:       z.string().optional(),
  propietario:   z.string().optional().nullable(),
  telefono:      z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const finca = await prisma.finca.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!finca) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(finca);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const finca = await prisma.finca.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!finca) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  const updated = await prisma.finca.update({ where: { id: params.id }, data: parsed.data as any });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const finca = await prisma.finca.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!finca) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  await prisma.finca.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
