import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET + PUT croquis de la finca
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const fincaId = new URL(req.url).searchParams.get("fincaId");
  if (!fincaId) return NextResponse.json({ error: "fincaId requerido" }, { status: 400 });

  const croquis = await prisma.croquis.findUnique({
    where: { fincaId },
  });

  return NextResponse.json(croquis ?? { data: null, fincaId });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { fincaId, data, thumbnail } = await req.json();
  if (!fincaId) return NextResponse.json({ error: "fincaId requerido" }, { status: 400 });

  const finca = await prisma.finca.findFirst({
    where: { id: fincaId, userId: session.user.id },
  });
  if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

  const croquis = await prisma.croquis.upsert({
    where: { fincaId },
    update: { data, thumbnail },
    create: { fincaId, data, thumbnail },
  });

  return NextResponse.json(croquis);
}
