import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cultivoSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const fincaId = new URL(req.url).searchParams.get("fincaId");

  const cultivos = await prisma.cultivo.findMany({
    where: {
      parcela: {
        ...(fincaId ? { fincaId } : {}),
        finca: { userId: session.user.id },
      },
    },
    include: {
      parcela: { select: { id: true, nombre: true } },
      labores: { orderBy: { fecha: "desc" }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cultivos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await req.json();
  const parsed = cultivoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const parcela = await prisma.parcela.findFirst({
    where: { id: parsed.data.parcelaId, finca: { userId: session.user.id } },
  });
  if (!parcela) return NextResponse.json({ error: "Parcela no encontrada" }, { status: 404 });

  const cultivo = await prisma.cultivo.create({ data: parsed.data as any });
  return NextResponse.json(cultivo, { status: 201 });
}
