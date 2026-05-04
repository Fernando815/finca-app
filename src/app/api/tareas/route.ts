import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tareaSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fincaId  = searchParams.get("fincaId");
  const estado   = searchParams.get("estado");
  const prioridad= searchParams.get("prioridad");
  const categoria= searchParams.get("categoria");

  if (!fincaId) return NextResponse.json({ error: "fincaId requerido" }, { status: 400 });

  // Auto-vencer tareas pasadas
  await prisma.tarea.updateMany({
    where: {
      fincaId,
      estado: { in: ["PENDIENTE", "EN_PROCESO"] },
      fechaLimite: { lt: new Date() },
    },
    data: { estado: "VENCIDA" },
  });

  const tareas = await prisma.tarea.findMany({
    where: {
      fincaId,
      finca: { userId: session.user.id },
      ...(estado    ? { estado:    estado    as any } : {}),
      ...(prioridad ? { prioridad: prioridad as any } : {}),
      ...(categoria ? { categoria: categoria as any } : {}),
    },
    include: { peon: { select: { id: true, nombre: true, cargo: true } } },
    orderBy: [{ prioridad: "desc" }, { fechaLimite: "asc" }],
  });

  return NextResponse.json(tareas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await req.json();
  const parsed = tareaSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const finca = await prisma.finca.findFirst({
    where: { id: parsed.data.fincaId, userId: session.user.id },
  });
  if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

  const tarea = await prisma.tarea.create({ data: parsed.data as any });
  return NextResponse.json(tarea, { status: 201 });
}
