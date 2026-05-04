import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const tarea = await prisma.tarea.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!tarea) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });

  const data: any = { ...body };
  if (body.estado === "COMPLETADA") data.completadaEn = new Date();

  const updated = await prisma.tarea.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tarea = await prisma.tarea.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!tarea) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.tarea.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
