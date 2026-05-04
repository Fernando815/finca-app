import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const peonSchema = z.object({
  nombre:            z.string().min(2, "Nombre requerido"),
  cedula:            z.string().optional(),
  cargo:             z.string().default("PEON"),
  telefono:          z.string().optional(),
  salario:           z.coerce.number().positive().optional(),
  fechaContratacion: z.coerce.date().default(() => new Date()),
  estado:            z.string().default("ACTIVO"),
  notas:             z.string().optional(),
  fincaId:           z.string().min(1, "Finca requerida"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const fincaId = new URL(req.url).searchParams.get("fincaId");
  if (!fincaId) return NextResponse.json({ error: "fincaId requerido" }, { status: 400 });

  // Verificar que la finca pertenece al usuario
  const finca = await prisma.finca.findFirst({ where: { id: fincaId, userId: session.user.id } });
  if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

  const peones = await prisma.peon.findMany({
    where: { fincaId },
    orderBy: [{ estado: "asc" }, { nombre: "asc" }],
  });
  return NextResponse.json(peones);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await req.json();
  const parsed = peonSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const finca = await prisma.finca.findFirst({ where: { id: parsed.data.fincaId, userId: session.user.id } });
  if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

  const peon = await prisma.peon.create({ data: parsed.data as any });
  return NextResponse.json(peon, { status: 201 });
}
