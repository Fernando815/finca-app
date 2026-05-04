import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const finca = await prisma.finca.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } });
    if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const mesParam = searchParams.get("mes"); // YYYY-MM (opcional, si no se da usa mes actual)

    const now  = new Date();
    const year = mesParam ? parseInt(mesParam.split("-")[0]) : now.getFullYear();
    const mon  = mesParam ? parseInt(mesParam.split("-")[1]) : now.getMonth() + 1;

    const mesInicio = new Date(year, mon - 1, 1);
    const mesFin    = new Date(year, mon, 1);

    // Transacciones del mes seleccionado
    const transaccionesMes = await prisma.transaccion.findMany({
      where: { fincaId: finca.id, fecha: { gte: mesInicio, lt: mesFin } },
    });

    let totalIngresos = 0;
    let totalEgresos  = 0;
    const byCategoria: Record<string, { monto: number; tipo: string }> = {};

    for (const t of transaccionesMes) {
      const monto = Number(t.monto);
      if (t.tipo === "INGRESO") totalIngresos += monto;
      else totalEgresos += monto;

      if (!byCategoria[t.categoria]) byCategoria[t.categoria] = { monto: 0, tipo: t.tipo };
      byCategoria[t.categoria].monto += monto;
    }

    // Últimos 6 meses para la gráfica
    const seisMesesAtras = new Date(year, mon - 7, 1);
    const historico = await prisma.transaccion.findMany({
      where: { fincaId: finca.id, fecha: { gte: seisMesesAtras, lt: mesFin } },
      select: { fecha: true, tipo: true, monto: true },
    });

    const monthMap: Record<string, { mes: string; ingresos: number; egresos: number }> = {};
    for (const t of historico) {
      const d   = new Date(t.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[key]) monthMap[key] = { mes: key, ingresos: 0, egresos: 0 };
      if (t.tipo === "INGRESO") monthMap[key].ingresos += Number(t.monto);
      else monthMap[key].egresos += Number(t.monto);
    }

    const ultimos6Meses = Object.values(monthMap).sort((a, b) => a.mes.localeCompare(b.mes));

    return NextResponse.json({
      mes:           `${year}-${String(mon).padStart(2, "0")}`,
      totalIngresos,
      totalEgresos,
      balance:       totalIngresos - totalEgresos,
      byCategoria,
      ultimos6Meses,
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
