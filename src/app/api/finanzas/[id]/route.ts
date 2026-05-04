import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CATEGORIAS_INGRESO = ["VENTA_ANIMAL", "VENTA_LECHE", "VENTA_CULTIVO", "SUBSIDIO", "OTRO_INGRESO"] as const;
const CATEGORIAS_EGRESO  = ["VETERINARIO", "ALIMENTACION", "SALARIO", "MANTENIMIENTO", "COMBUSTIBLE", "INSUMOS", "IMPUESTOS", "OTRO_EGRESO"] as const;

const updateSchema = z.object({
  fecha:       z.string().datetime().or(z.string().date()).optional(),
  categoria:   z.string().min(1).optional(),
  monto:       z.number().positive().optional(),
  descripcion: z.string().min(1).max(300).optional(),
  notas:       z.string().max(500).optional().nullable(),
});

async function getOwned(id: string, userId: string) {
  return prisma.transaccion.findFirst({
    where: { id, finca: { userId } },
    include: { animal: { select: { id: true, codigo: true, nombre: true } } },
  });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const t = await getOwned(params.id, session.user.id);
    if (!t) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(t);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const existing = await getOwned(params.id, session.user.id);
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    let body: unknown;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const data = parsed.data;

    // Validate categoria/tipo combo if categoria changes
    if (data.categoria) {
      if (existing.tipo === "INGRESO" && !(CATEGORIAS_INGRESO as readonly string[]).includes(data.categoria)) {
        return NextResponse.json({ error: "Categoría inválida para INGRESO" }, { status: 400 });
      }
      if (existing.tipo === "EGRESO" && !(CATEGORIAS_EGRESO as readonly string[]).includes(data.categoria)) {
        return NextResponse.json({ error: "Categoría inválida para EGRESO" }, { status: 400 });
      }
    }

    const updated = await prisma.transaccion.update({
      where: { id: params.id },
      data: {
        ...(data.fecha       ? { fecha:       new Date(data.fecha) }   : {}),
        ...(data.categoria   ? { categoria:   data.categoria }         : {}),
        ...(data.monto       ? { monto:       data.monto }             : {}),
        ...(data.descripcion ? { descripcion: data.descripcion }       : {}),
        ...(data.notas !== undefined ? { notas: data.notas }           : {}),
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const existing = await getOwned(params.id, session.user.id);
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.transaccion.delete({ where: { id: params.id } });
      // Si era una venta de animal, revertir estado a ACTIVO
      if (existing.categoria === "VENTA_ANIMAL" && existing.animalId) {
        await tx.animal.update({ where: { id: existing.animalId }, data: { estado: "ACTIVO" } });
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
