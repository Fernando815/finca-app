import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const registro = await prisma.historialMedico.findFirst({
    where: { id: params.id, animal: { finca: { userId: session.user.id } } },
  });
  if (!registro) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.historialMedico.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const registro = await prisma.historialMedico.findFirst({
    where: { id: params.id, animal: { finca: { userId: session.user.id } } },
  });
  if (!registro) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.historialMedico.update({
    where: { id: params.id },
    data: {
      tipo:              body.tipo,
      producto:          body.producto,
      dosis:             body.dosis,
      viaAdministracion: body.viaAdministracion,
      veterinario:       body.veterinario,
      costo:             body.costo ? parseFloat(body.costo) : undefined,
      proximaFecha:      body.proximaFecha ? new Date(body.proximaFecha) : null,
      notas:             body.notas,
      fecha:             body.fecha ? new Date(body.fecha) : undefined,
    },
  });
  return NextResponse.json(updated);
}
