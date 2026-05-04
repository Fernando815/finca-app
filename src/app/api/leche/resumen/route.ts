import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fincaId = searchParams.get("fincaId");
  const mes     = searchParams.get("mes"); // formato YYYY-MM

  if (!fincaId) return NextResponse.json({ error: "fincaId requerido" }, { status: 400 });

  // Verificar que la finca pertenece al usuario
  const finca = await prisma.finca.findFirst({ where: { id: fincaId, userId: session.user.id } });
  if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

  // Calcular rango de fechas
  let fechaDesde: Date;
  let fechaHasta: Date;

  if (mes) {
    const [year, month] = mes.split("-").map(Number);
    fechaDesde = new Date(year, month - 1, 1);
    fechaHasta = new Date(year, month, 0, 23, 59, 59, 999); // último día del mes
  } else {
    // Por defecto: últimos 30 días
    fechaHasta = new Date();
    fechaDesde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // Obtener todos los registros del período
  const registros = await prisma.registroLeche.findMany({
    where: {
      fincaId,
      fecha: { gte: fechaDesde, lte: fechaHasta },
    },
    include: {
      animal: { select: { id: true, codigo: true, nombre: true } },
      lote:   { select: { id: true, nombre: true } },
    },
    orderBy: { fecha: "asc" },
  });

  // Agrupar por día para la gráfica de tendencia
  const porDia: Record<string, number> = {};
  for (const r of registros) {
    const dia = r.fecha.toISOString().slice(0, 10);
    porDia[dia] = (porDia[dia] ?? 0) + r.litros;
  }
  const tendencia = Object.entries(porDia)
    .map(([fecha, litros]) => ({ fecha, litros }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // Totales generales
  const totalLitros = registros.reduce((s, r) => s + r.litros, 0);
  const diasConRegistro = tendencia.length;
  const promedioDiario = diasConRegistro > 0 ? totalLitros / diasConRegistro : 0;

  // Ranking por animal (solo registros individuales)
  const porAnimal: Record<string, { id: string; codigo: string; nombre: string | null; litros: number; registros: number }> = {};
  for (const r of registros) {
    if (r.animalId && r.animal) {
      const key = r.animalId;
      if (!porAnimal[key]) {
        porAnimal[key] = { id: r.animal.id, codigo: r.animal.codigo, nombre: r.animal.nombre, litros: 0, registros: 0 };
      }
      porAnimal[key].litros    += r.litros;
      porAnimal[key].registros += 1;
    }
  }
  const rankingAnimales = Object.values(porAnimal)
    .sort((a, b) => b.litros - a.litros)
    .slice(0, 10);

  // Resumen por lote
  const porLote: Record<string, { id: string; nombre: string; litros: number; registros: number }> = {};
  for (const r of registros) {
    if (r.loteId && r.lote) {
      const key = r.loteId;
      if (!porLote[key]) {
        porLote[key] = { id: r.lote.id, nombre: r.lote.nombre, litros: 0, registros: 0 };
      }
      porLote[key].litros    += r.litros;
      porLote[key].registros += 1;
    }
  }
  const resumenLotes = Object.values(porLote).sort((a, b) => b.litros - a.litros);

  return NextResponse.json({
    periodo: { desde: fechaDesde.toISOString(), hasta: fechaHasta.toISOString(), mes },
    totalLitros,
    diasConRegistro,
    promedioDiario,
    tendencia,
    rankingAnimales,
    resumenLotes,
    totalRegistros: registros.length,
  });
}
