import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const laborSchema = z.object({
  cultivoId: z.string().min(1),
  fecha:     z.coerce.date().optional(),
  tipo:      z.enum(["FERTILIZACION","LIMPIEZA","PODA","FUMIGACION","COSECHA","RIEGO","CONTROL_PLAGAS","SIEMBRA","OTRO"]),
  producto:  z.string().optional().nullable(),
  cantidad:  z.coerce.number().positive().optional().nullable(),
  unidad:    z.string().optional().nullable(),
  costo:     z.coerce.number().nonnegative().optional().nullable(),
  realizado: z.boolean().default(false),
  notas:     z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await req.json();
  const parsed = laborSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const cultivo = await prisma.cultivo.findFirst({
    where: { id: parsed.data.cultivoId, parcela: { finca: { userId: session.user.id } } },
  });
  if (!cultivo) return NextResponse.json({ error: "Cultivo no encontrado" }, { status: 404 });

  const labor = await prisma.laborAgricola.create({ data: parsed.data as any });
  return NextResponse.json(labor, { status: 201 });
}
