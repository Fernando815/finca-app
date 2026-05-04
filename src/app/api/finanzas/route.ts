import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CATEGORIAS_INGRESO = ["VENTA_ANIMAL", "VENTA_LECHE", "VENTA_CULTIVO", "SUBSIDIO", "OTRO_INGRESO"] as const;
const CATEGORIAS_EGRESO  = ["VETERINARIO", "ALIMENTACION", "SALARIO", "MANTENIMIENTO", "COMBUSTIBLE", "INSUMOS", "IMPUESTOS", "OTRO_EGRESO"] as const;

const schema = z.object({
  fecha:       z.string().datetime().or(z.string().date()),
  tipo:        z.enum(["INGRESO", "EGRESO"]),
  categoria:   z.string().min(1),
  monto:       z.number().positive(),
  descripcion: z.string().min(1).max(300),
  notas:       z.string().max(500).optional().nullable(),
  animalId:    z.string().optional().nullable(),
}).refine((d) => {
  if (d.tipo === "INGRESO") return (CATEGORIAS_INGRESO as readonly string[]).includes(d.categoria);
  return (CATEGORIAS_EGRESO as readonly string[]).includes(d.categoria);
}, { message: "Categoría inválida para el tipo seleccionado" });

async function getFinca(userId: string) {
  return prisma.finca.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const finca = await getFinca(session.user.id);
    if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const mes  = searchParams.get("mes"); // YYYY-MM
    const tipo = searchParams.get("tipo"); // INGRESO | EGRESO

    const where: Record<string, unknown> = { fincaId: finca.id };
    if (mes) {
      const [y, m] = mes.split("-").map(Number);
      where.fecha = {
        gte: new Date(y, m - 1, 1),
        lt:  new Date(y, m, 1),
      };
    }
    if (tipo) where.tipo = tipo;

    const transacciones = await prisma.transaccion.findMany({
      where,
      include: { animal: { select: { id: true, codigo: true, nombre: true } } },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json(transacciones);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const finca = await getFinca(session.user.id);
    if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

    let body: unknown;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const data = parsed.data;

    // Snapshot y validación de animal
    let animalCodigo: string | undefined;
    let animalNombre: string | undefined;
    if (data.animalId) {
      const animal = await prisma.animal.findFirst({ where: { id: data.animalId, fincaId: finca.id } });
      if (!animal) return NextResponse.json({ error: "Animal no encontrado en esta finca" }, { status: 400 });
      if (data.categoria === "VENTA_ANIMAL" && (animal.estado === "VENDIDO" || animal.estado === "MUERTO")) {
        return NextResponse.json({ error: `El animal ya está en estado ${animal.estado}` }, { status: 400 });
      }
      animalCodigo = animal.codigo;
      animalNombre = animal.nombre ?? undefined;
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaccion = await tx.transaccion.create({
        data: {
          fecha:        new Date(data.fecha),
          tipo:         data.tipo,
          categoria:    data.categoria,
          monto:        data.monto,
          descripcion:  data.descripcion,
          notas:        data.notas ?? null,
          fincaId:      finca.id,
          animalId:     data.animalId ?? null,
          animalCodigo: animalCodigo ?? null,
          animalNombre: animalNombre ?? null,
        },
      });
      // Marcar animal como VENDIDO si es venta
      if (data.categoria === "VENTA_ANIMAL" && data.animalId) {
        await tx.animal.update({ where: { id: data.animalId }, data: { estado: "VENDIDO" } });
      }
      return transaccion;
    });

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
