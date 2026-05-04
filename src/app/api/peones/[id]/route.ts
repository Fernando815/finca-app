import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const peon = await prisma.peon.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!peon) return NextResponse.json({ error: "Peón no encontrado" }, { status: 404 });

  const updated = await prisma.peon.update({
    where: { id: params.id },
    data: {
      nombre:            body.nombre,
      cedula:            body.cedula,
      cargo:             body.cargo,
      telefono:          body.telefono,
      salario:           body.salario ? parseFloat(body.salario) : undefined,
      fechaContratacion: body.fechaContratacion ? new Date(body.fechaContratacion) : undefined,
      estado:            body.estado,
      notas:             body.notas,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const peon = await prisma.peon.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!peon) return NextResponse.json({ error: "Peón no encontrado" }, { status: 404 });

  await prisma.peon.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
