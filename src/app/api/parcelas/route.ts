import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/parcelas?fincaId=xxx
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const fincaId = new URL(req.url).searchParams.get("fincaId");

  const parcelas = await prisma.parcela.findMany({
    where: {
      finca: {
        userId: session.user.id,
        ...(fincaId ? { id: fincaId } : {}),
      },
    },
    include: {
      _count: { select: { cultivos: true } },
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(parcelas);
}

const parcelaSchema = z.object({
  nombre:        z.string().min(1, "Nombre requerido"),
  numero:        z.coerce.number().int().positive().optional().nullable(),
  areaHectareas: z.coerce.number().positive().optional().nullable(),
  tipo:          z.enum(["CULTIVO","PASTO","BOSQUE","INFRAESTRUCTURA","OTRO"]).default("CULTIVO"),
  notas:         z.string().optional().nullable(),
  fincaId:       z.string().min(1, "Finca requerida"),
});

// POST /api/parcelas
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await req.json();
  const parsed = parcelaSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  // Verify finca belongs to user
  const finca = await prisma.finca.findFirst({
    where: { id: parsed.data.fincaId, userId: session.user.id },
  });
  if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

  const parcela = await prisma.parcela.create({ data: parsed.data as any });
  return NextResponse.json(parcela, { status: 201 });
}
