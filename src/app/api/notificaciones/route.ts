import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const leida = new URL(req.url).searchParams.get("leida");
  const notificaciones = await prisma.notificacion.findMany({
    where: {
      userId: session.user.id,
      ...(leida !== null ? { leida: leida === "true" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json(notificaciones);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  // Mark all as read or specific id
  if (body.all) {
    await prisma.notificacion.updateMany({
      where: { userId: session.user.id, leida: false },
      data: { leida: true },
    });
  } else if (body.id) {
    await prisma.notificacion.updateMany({
      where: { id: body.id, userId: session.user.id },
      data: { leida: true },
    });
  }
  return NextResponse.json({ ok: true });
}
