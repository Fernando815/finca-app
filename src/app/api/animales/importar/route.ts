import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

const TIPOS_VALIDOS   = ["VACA","TORO","TERNERO","TERNERA","CABALLO","YEGUA","OVEJA","CABRA","CERDO","OTRO"];
const SEXOS_VALIDOS   = ["MACHO","HEMBRA"];
const ESTADOS_VALIDOS = ["ACTIVO","VENDIDO","ENFERMO","MUERTO","EN_TRATAMIENTO","PRENADA","EN_CELO","SECO"];
const ENFOQUES_VALIDOS= ["LECHE","CARNE","CRIA","DOBLE_PROPOSITO"];

function parseDate(val: any): Date | undefined {
  if (!val) return undefined;
  // Número serial de Excel
  if (typeof val === "number") {
    return XLSX.SSF.parse_date_code(val) ? new Date((val - 25569) * 86400 * 1000) : undefined;
  }
  const str = String(val).trim();
  // DD/MM/AAAA
  const ddmm = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmm) return new Date(`${ddmm[3]}-${ddmm[2].padStart(2,"0")}-${ddmm[1].padStart(2,"0")}`);
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const fincaId  = formData.get("fincaId") as string | null;

  if (!file || !fincaId) {
    return NextResponse.json({ error: "Archivo y fincaId son requeridos" }, { status: 400 });
  }

  // Verificar que la finca pertenece al usuario
  const finca = await prisma.finca.findFirst({ where: { id: fincaId, userId: session.user.id } });
  if (!finca) return NextResponse.json({ error: "Finca no encontrada" }, { status: 404 });

  // Cargar lotes de la finca para resolver nombres → IDs
  const lotes = await prisma.lote.findMany({ where: { fincaId } });
  const loteMap = new Map(lotes.map(l => [l.nombre.toLowerCase().trim(), l.id]));

  // Parsear Excel
  const buffer    = Buffer.from(await file.arrayBuffer());
  const workbook  = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet     = workbook.Sheets[sheetName];

  // Leer desde fila 3 (índice 2 = encabezados reales), datos desde fila 4 en adelante
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { range: 2, defval: "" });

  const creados:  any[] = [];
  const errores:  { fila: number; codigo: string; error: string }[] = [];
  const omitidos: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const fila  = i + 4; // fila real en Excel (encabezado=3, datos=4+)
    const row   = rows[i];

    // Mapear columnas (nombres del encabezado del Excel)
    const codigo  = String(row["Codigo *"] ?? row["Código *"] ?? "").trim();
    const nombre  = String(row["Nombre"] ?? "").trim() || undefined;
    const tipo    = String(row["Tipo *"]  ?? "").trim().toUpperCase();
    const raza    = String(row["Raza"]    ?? "").trim() || undefined;
    const sexo    = String(row["Sexo *"]  ?? "").trim().toUpperCase();
    const estado  = String(row["Estado *"]?? "").trim().toUpperCase() || "ACTIVO";
    const enfoque = String(row["Enfoque"] ?? "").trim().toUpperCase() || undefined;
    const loteNom = String(row["Lote"]    ?? "").trim();
    const notas   = String(row["Notas"]   ?? "").trim() || undefined;
    const color   = String(row["Color"]   ?? "").trim() || undefined;

    const edadRaw  = row["Edad (meses)"];
    const pesoRaw  = row["Peso estimado (kg)"];
    const fechaRaw = row["Fecha nacimiento"];

    // Saltar filas vacías
    if (!codigo && !tipo && !sexo) { omitidos.push(fila); continue; }

    // Validaciones
    const errs: string[] = [];
    if (!codigo)                          errs.push("Código obligatorio");
    if (!TIPOS_VALIDOS.includes(tipo))    errs.push(`Tipo inválido: "${tipo}"`);
    if (!SEXOS_VALIDOS.includes(sexo))    errs.push(`Sexo inválido: "${sexo}"`);
    if (!ESTADOS_VALIDOS.includes(estado))errs.push(`Estado inválido: "${estado}"`);
    if (enfoque && !ENFOQUES_VALIDOS.includes(enfoque)) errs.push(`Enfoque inválido: "${enfoque}"`);

    if (errs.length > 0) {
      errores.push({ fila, codigo: codigo || "—", error: errs.join(" | ") });
      continue;
    }

    // Resolver lote
    const loteId = loteNom ? (loteMap.get(loteNom.toLowerCase()) ?? undefined) : undefined;

    const edadMeses    = edadRaw  ? parseInt(String(edadRaw))  : undefined;
    const pesoEstimado = pesoRaw  ? parseFloat(String(pesoRaw)): undefined;
    const fechaNacimiento = fechaRaw ? parseDate(fechaRaw) : undefined;

    try {
      const animal = await prisma.animal.create({
        data: {
          codigo, nombre, tipo: tipo as any, raza, sexo: sexo as any,
          edadMeses: isNaN(edadMeses!) ? undefined : edadMeses,
          pesoEstimado: isNaN(pesoEstimado!) ? undefined : pesoEstimado,
          fechaNacimiento, color, estado: estado as any,
          enfoque: (enfoque as any) || undefined,
          notas, fincaId,
          loteId: loteId ?? undefined,
        },
      });
      creados.push(animal);
    } catch (e: any) {
      const msg = e.code === "P2002"
        ? `Código "${codigo}" ya existe en esta finca`
        : e.message?.slice(0, 80) ?? "Error desconocido";
      errores.push({ fila, codigo, error: msg });
    }
  }

  return NextResponse.json({
    creados:  creados.length,
    errores,
    omitidos: omitidos.length,
    total:    rows.length,
  });
}
