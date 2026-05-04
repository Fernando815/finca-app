import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const partoSchema = z.object({
  animalId:      z.string().min(1),
  fecha:         z.coerce.date(),
  tipoParto:     z.string().optional(),
  crias:         z.coerce.number().int().min(1).default(1),
  sexoCria:      z.string().optional(),
  pesoAlNacer:   z.coerce.number().positive().optional(),
  estadoCria:    z.string().optional(),
  complicaciones:z.string().optional(),
  proximoParto:  z.coerce.date().optional(),
  notas:         z.string().optional(),
  // Datos para registrar la(s) cría(s) como nuevo animal
  codigoCria:    z.string().optional(),
  nombreCria:    z.string().optional(),
  razaCria:      z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const animalId = new URL(req.url).searchParams.get("animalId");
  if (!animalId) return NextResponse.json({ error: "animalId requerido" }, { status: 400 });

  const partos = await prisma.parto.findMany({
    where: { animalId, animal: { finca: { userId: session.user.id } } },
    orderBy: { fecha: "desc" },
  });
  return NextResponse.json(partos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await req.json();
  const parsed = partoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const animal = await prisma.animal.findFirst({
    where: { id: parsed.data.animalId, finca: { userId: session.user.id } },
    include: { lote: { select: { id: true } } },
  });
  if (!animal) return NextResponse.json({ error: "Animal no encontrado" }, { status: 404 });

  // Actualizar estado y próximo parto en la madre
  const updateData: any = { estado: "ACTIVO" };
  if (parsed.data.proximoParto) updateData.notas = `Próximo parto estimado: ${parsed.data.proximoParto.toLocaleDateString("es-CR")}`;
  await prisma.animal.update({ where: { id: animal.id }, data: updateData });

  // Crear registro de parto (sin campos extra de cría)
  const { codigoCria, nombreCria, razaCria, ...partoData } = parsed.data;
  const parto = await prisma.parto.create({ data: partoData as any });

  // Registrar cada cría como nuevo animal
  const criasRegistradas: any[] = [];
  if (codigoCria) {
    const numCrias = parsed.data.crias ?? 1;
    for (let i = 0; i < numCrias; i++) {
      // Código: si hay varias crías, agrega sufijo -A, -B, etc.
      const codigo = numCrias > 1 ? `${codigoCria}-${String.fromCharCode(65 + i)}` : codigoCria;
      const nombre = numCrias > 1 && nombreCria ? `${nombreCria} ${String.fromCharCode(65 + i)}` : (nombreCria || undefined);

      // Determinar tipo según sexo
      let tipo = "TERNERO";
      if (parsed.data.sexoCria === "HEMBRA") tipo = "TERNERA";
      else if (parsed.data.sexoCria === "MIXTO") tipo = i % 2 === 0 ? "TERNERO" : "TERNERA";

      // Estado según estadoCria
      let estado = "ACTIVO";
      if (parsed.data.estadoCria === "MUERTO") estado = "MUERTO";
      else if (parsed.data.estadoCria === "DEBIL") estado = "EN_TRATAMIENTO";

      try {
        const cria = await prisma.animal.create({
          data: {
            codigo,
            nombre,
            tipo,
            sexo:          parsed.data.sexoCria === "HEMBRA" ? "HEMBRA" : "MACHO",
            raza:          razaCria ?? animal.raza ?? undefined,
            pesoEstimado:  parsed.data.pesoAlNacer ?? undefined,
            fechaNacimiento: parsed.data.fecha,
            estado,
            fincaId:       animal.fincaId,
            madreId:       animal.id,
            loteId:        (animal as any).lote?.id ?? undefined,
          },
        });
        criasRegistradas.push(cria);
      } catch (e: any) {
        // Si el código ya existe, ignorar y continuar
        if (!e.message?.includes("Unique constraint")) throw e;
      }
    }
  }

  return NextResponse.json({ parto, criasRegistradas }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  await prisma.parto.deleteMany({
    where: { id, animal: { finca: { userId: session.user.id } } },
  });
  return NextResponse.json({ ok: true });
}
