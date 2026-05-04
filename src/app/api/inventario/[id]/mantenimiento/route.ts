import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const item = await prisma.inventarioItem.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json();
  const { proximaFecha, ...rest } = body;

  const registro = await prisma.mantenimientoRegistro.create({
    data: { itemId: params.id, ...rest, ...(proximaFecha ? { proximaFecha: new Date(proximaFecha) } : {}) },
  });

  // Update ultimoMantenimiento and proximoMantenimiento on the item
  await prisma.inventarioItem.update({
    where: { id: params.id },
    data: {
      ultimoMantenimiento: new Date(rest.fecha ?? Date.now()),
      ...(proximaFecha ? { proximoMantenimiento: new Date(proximaFecha) } : {}),
    },
  });

  return NextResponse.json(registro, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const registros = await prisma.mantenimientoRegistro.findMany({
    where: { itemId: params.id, item: { finca: { userId: session.user.id } } },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(registros);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const registroId = req.nextUrl.searchParams.get("registroId");
  if (!registroId) return NextResponse.json({ error: "registroId requerido" }, { status: 400 });

  await prisma.mantenimientoRegistro.delete({ where: { id: registroId } });
  return NextResponse.json({ success: true });
}
