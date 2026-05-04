import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const loteSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional().nullable(),
  fincaId: z.string().min(1),
  tipo: z.enum(["ENGORDE","CRIA","LECHE","MIXTO"]).default("MIXTO"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const fincaId = new URL(req.url).searchParams.get("fincaId");
  const lotes = await prisma.lote.findMany({
    where: {
      finca: { userId: session.user.id },
      ...(fincaId ? { fincaId } : {}),
    },
    include: {
      _count: { select: { animales: true } },
      movimientos: {
        where: { fechaSalida: null },
        include: { potrero: { select: { id: true, nombre: true } } },
        take: 1,
        orderBy: { fechaEntrada: "desc" },
      },
    },
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(lotes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  const parsed = loteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  const finca = await prisma.finca.findFirst({ where: { id: parsed.data.fincaId, userId: session.user.id } });
  if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });
  const lote = await prisma.lote.create({ data: parsed.data as any });
  return NextResponse.json(lote, { status: 201 });
}
