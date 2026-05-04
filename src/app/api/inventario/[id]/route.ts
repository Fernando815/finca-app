import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const item = await prisma.inventarioItem.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
    include: { mantenimientos: { orderBy: { fecha: "desc" } } },
  });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const item = await prisma.inventarioItem.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.inventarioItem.update({
    where: { id: params.id },
    data: body,
    include: { mantenimientos: { orderBy: { fecha: "desc" }, take: 1 } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const item = await prisma.inventarioItem.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
  });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.inventarioItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
