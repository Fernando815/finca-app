import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fincaSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const fincas = await prisma.finca.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { animales: true, potreros: true, parcelas: true, tareas: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(fincas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = fincaSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const finca = await prisma.finca.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json(finca, { status: 201 });
}
