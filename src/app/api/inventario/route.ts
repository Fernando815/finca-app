import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const fincaId = req.nextUrl.searchParams.get("fincaId");
  if (!fincaId) return NextResponse.json({ error: "fincaId requerido" }, { status: 400 });

  const finca = await prisma.finca.findFirst({ where: { id: fincaId, userId: session.user.id } });
  if (!finca) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const categoria = req.nextUrl.searchParams.get("categoria");
  const items = await prisma.inventarioItem.findMany({
    where: { fincaId, ...(categoria ? { categoria } : {}) },
    include: {
      mantenimientos: { orderBy: { fecha: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const { fincaId, proximoMantenimiento, ...data } = body;

    const finca = await prisma.finca.findFirst({ where: { id: fincaId, userId: session.user.id } });
    if (!finca) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const item = await prisma.inventarioItem.create({
      data: {
        fincaId,
        ...data,
        ...(proximoMantenimiento ? { proximoMantenimiento: new Date(proximoMantenimiento) } : {}),
      },
      include: { mantenimientos: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/inventario]", e);
    return NextResponse.json({ error: e.message ?? "Error interno" }, { status: 500 });
  }
}
