import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const directUrl = "postgresql://neondb_owner:npg_Iogsh9bPF7mT@ep-frosty-pine-amsub7he.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30";

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
});

async function main() {
  console.log("🌱 Sembrando datos para Carlos Vega...");

  // ── 1. USUARIO ────────────────────────────────────────────────
  const hash = await bcrypt.hash("carlos1234", 12);
  const carlos = await prisma.user.upsert({
    where: { email: "carlos.vegaalfaro815@gmail.com" },
    update: {},
    create: {
      name: "Carlos Vega Alfaro",
      email: "carlos.vegaalfaro815@gmail.com",
      password: hash,
      role: "PRODUCTOR",
      phone: "+506 8888-1234",
    },
  });
  console.log("✅ Usuario creado:", carlos.email);

  // ── 2. SUSCRIPCIÓN ────────────────────────────────────────────
  await prisma.suscripcion.upsert({
    where: { userId: carlos.id },
    update: {},
    create: {
      plan: "PRO",
      estado: "ACTIVA",
      fechaVencimiento: new Date("2026-12-31"),
      userId: carlos.id,
    },
  });
  console.log("✅ Suscripción PRO creada");

  // ── 3. FINCA ──────────────────────────────────────────────────
  const finca = await prisma.finca.create({
    data: {
      nombre: "Finca El Paraíso",
      descripcion: "Finca ganadera y agrícola en el Valle Central",
      provincia: "Alajuela",
      canton: "San Ramón",
      distrito: "Santiago",
      areaTotal: 85.5,
      enfoque: "MIXTA",
      userId: carlos.id,
    },
  });
  console.log("✅ Finca creada:", finca.nombre);

  // ── 4. PEONES (2) ─────────────────────────────────────────────
  const peon1 = await prisma.peon.create({
    data: {
      nombre: "Rodrigo Jiménez",
      cedula: "1-2345-6789",
      cargo: "VAQUERO",
      telefono: "+506 7777-0001",
      salario: 350000,
      estado: "ACTIVO",
      fincaId: finca.id,
    },
  });
  const peon2 = await prisma.peon.create({
    data: {
      nombre: "Marcos Solís",
      cedula: "2-9876-5432",
      cargo: "OPERADOR",
      telefono: "+506 7777-0002",
      salario: 380000,
      estado: "ACTIVO",
      fincaId: finca.id,
    },
  });
  console.log("✅ 2 peones creados");

  // ── 5. POTREROS (3) ───────────────────────────────────────────
  const potreroNorte = await prisma.potrero.create({
    data: {
      nombre: "Potrero El Bosque",
      numero: 1,
      areHectareas: 12.0,
      capacidadAnimales: 25,
      tipoUso: "LECHE",
      disponible: false,
      estadoPasto: "EXCELENTE",
      diasOcupacionMaximo: 7,
      diasDescansoMinimo: 28,
      notas: "Pasto kikuyo renovado en marzo",
      fincaId: finca.id,
    },
  });
  const potreroCentro = await prisma.potrero.create({
    data: {
      nombre: "Potrero La Ladera",
      numero: 2,
      areHectareas: 18.0,
      capacidadAnimales: 35,
      tipoUso: "ENGORDE",
      disponible: true,
      estadoPasto: "BUENO",
      diasOcupacionMaximo: 10,
      diasDescansoMinimo: 35,
      fincaId: finca.id,
    },
  });
  const potreroSur = await prisma.potrero.create({
    data: {
      nombre: "Potrero La Cañada",
      numero: 3,
      areHectareas: 8.5,
      capacidadAnimales: 15,
      tipoUso: "CRIA",
      disponible: true,
      estadoPasto: "REGULAR",
      diasOcupacionMaximo: 6,
      diasDescansoMinimo: 21,
      notas: "Reparar cerca del sector sur",
      fincaId: finca.id,
    },
  });
  console.log("✅ 3 potreros creados");

  // ── 6. LOTES (2) ──────────────────────────────────────────────
  const loteLeche = await prisma.lote.create({
    data: { nombre: "Lote Lechero", tipo: "LECHE", color: "#2563eb", fincaId: finca.id },
  });
  const loteEngorde = await prisma.lote.create({
    data: { nombre: "Lote Engorde", tipo: "ENGORDE", color: "#dc2626", fincaId: finca.id },
  });
  console.log("✅ 2 lotes creados");

  // ── 7. ANIMALES (10) ──────────────────────────────────────────
  const animales = await Promise.all([
    prisma.animal.create({ data: { codigo: "C001", nombre: "Estrella", tipo: "VACA", raza: "Holstein", sexo: "HEMBRA", edadMeses: 60, pesoEstimado: 580, color: "Blanca y negra", estado: "ACTIVO", enfoque: "LECHE", fincaId: finca.id, loteId: loteLeche.id } }),
    prisma.animal.create({ data: { codigo: "C002", nombre: "Luna", tipo: "VACA", raza: "Jersey", sexo: "HEMBRA", edadMeses: 48, pesoEstimado: 420, color: "Café claro", estado: "PRENADA", enfoque: "LECHE", fincaId: finca.id, loteId: loteLeche.id } }),
    prisma.animal.create({ data: { codigo: "C003", nombre: "Reina", tipo: "VACA", raza: "Brahman", sexo: "HEMBRA", edadMeses: 54, pesoEstimado: 500, color: "Gris", estado: "ACTIVO", enfoque: "CRIA", fincaId: finca.id, loteId: loteLeche.id } }),
    prisma.animal.create({ data: { codigo: "C004", nombre: "Rayo", tipo: "TORO", raza: "Brahman", sexo: "MACHO", edadMeses: 72, pesoEstimado: 850, color: "Gris oscuro", estado: "ACTIVO", enfoque: "CRIA", fincaId: finca.id, loteId: loteEngorde.id } }),
    prisma.animal.create({ data: { codigo: "C005", nombre: "Tormenta", tipo: "TORO", raza: "Holstein", sexo: "MACHO", edadMeses: 36, pesoEstimado: 620, color: "Negro y blanco", estado: "ACTIVO", enfoque: "CRIA", fincaId: finca.id, loteId: loteEngorde.id } }),
    prisma.animal.create({ data: { codigo: "C006", nombre: "Canela", tipo: "TERNERA", raza: "Jersey", sexo: "HEMBRA", edadMeses: 8, pesoEstimado: 120, color: "Café", estado: "ACTIVO", enfoque: "LECHE", fincaId: finca.id, loteId: loteLeche.id } }),
    prisma.animal.create({ data: { codigo: "C007", nombre: "Pinto", tipo: "TERNERO", raza: "Brahman", sexo: "MACHO", edadMeses: 6, pesoEstimado: 95, color: "Blanco con manchas", estado: "ACTIVO", enfoque: "CRIA", fincaId: finca.id, loteId: loteEngorde.id } }),
    prisma.animal.create({ data: { codigo: "C008", nombre: "Paloma", tipo: "VACA", raza: "Simmental", sexo: "HEMBRA", edadMeses: 42, pesoEstimado: 540, color: "Blanca", estado: "EN_TRATAMIENTO", enfoque: "DOBLE_PROPOSITO", fincaId: finca.id, loteId: loteLeche.id } }),
    prisma.animal.create({ data: { codigo: "C009", nombre: "Trueno", tipo: "CABALLO", raza: "Criollo", sexo: "MACHO", edadMeses: 84, pesoEstimado: 450, color: "Castaño", estado: "ACTIVO", fincaId: finca.id } }),
    prisma.animal.create({ data: { codigo: "C010", nombre: "Violeta", tipo: "YEGUA", raza: "Criollo", sexo: "HEMBRA", edadMeses: 60, pesoEstimado: 380, color: "Alazán", estado: "ACTIVO", fincaId: finca.id } }),
  ]);
  const [estrella, luna, reina, , , , , paloma] = animales;
  console.log("✅ 10 animales creados");

  // ── 8. HISTORIAL MÉDICO (8) ───────────────────────────────────
  await prisma.historialMedico.createMany({
    data: [
      { animalId: estrella.id, tipo: "VACUNA", producto: "Fiebre Aftosa", dosis: "2ml", viaAdministracion: "Subcutáneo", fecha: new Date("2025-03-01"), proximaFecha: new Date("2025-09-01"), veterinario: "Dr. Luis Mora", costo: 4500 },
      { animalId: estrella.id, tipo: "DESPARASITANTE", producto: "Ivermectina", dosis: "5ml", viaAdministracion: "Subcutáneo", fecha: new Date("2025-04-15"), proximaFecha: new Date("2025-10-15"), costo: 3200 },
      { animalId: luna.id, tipo: "VACUNA", producto: "Brucelosis", dosis: "1ml", viaAdministracion: "Intradérmica", fecha: new Date("2025-02-10"), veterinario: "Dr. Luis Mora", costo: 6000 },
      { animalId: luna.id, tipo: "VITAMINA", producto: "AD3E", dosis: "10ml", viaAdministracion: "Intramuscular", fecha: new Date("2025-04-01"), costo: 2800 },
      { animalId: reina.id, tipo: "VACUNA", producto: "Clostridiosis", dosis: "2ml", viaAdministracion: "Subcutáneo", fecha: new Date("2025-01-20"), proximaFecha: new Date("2026-01-20"), costo: 5500 },
      { animalId: paloma.id, tipo: "MEDICAMENTO", producto: "Oxitetraciclina", dosis: "15ml", viaAdministracion: "Intramuscular", fecha: new Date("2025-05-01"), proximaFecha: new Date("2025-05-07"), veterinario: "Dr. Ana Castro", costo: 12000, notas: "Tratamiento por mastitis" },
      { animalId: paloma.id, tipo: "DIAGNOSTICO", producto: "Examen California", dosis: "", fecha: new Date("2025-04-28"), veterinario: "Dr. Ana Castro", costo: 8000, notas: "CMT positivo cuartos traseros" },
      { animalId: animales[8].id, tipo: "VACUNA", producto: "Encefalomielitis Equina", dosis: "2ml", viaAdministracion: "Intramuscular", fecha: new Date("2025-03-15"), costo: 9000 },
    ],
  });
  console.log("✅ 8 historiales médicos creados");

  // ── 9. CELOS (3) ──────────────────────────────────────────────
  await prisma.celo.createMany({
    data: [
      { animalId: estrella.id, fecha: new Date("2025-01-10"), intensidad: "FUERTE", monta: true, toro: "Rayo (C004)", resultado: "PREÑADA" },
      { animalId: reina.id, fecha: new Date("2025-02-14"), intensidad: "MODERADA", inseminacion: true, resultado: "PREÑADA" },
      { animalId: animales[7].id, fecha: new Date("2025-04-22"), intensidad: "LEVE", monta: false },
    ],
  });
  console.log("✅ 3 celos registrados");

  // ── 10. PARTOS (2) ────────────────────────────────────────────
  await prisma.parto.createMany({
    data: [
      { animalId: luna.id, fecha: new Date("2024-11-20"), tipoParto: "NORMAL", crias: 1, sexoCria: "HEMBRA", pesoAlNacer: 32, estadoCria: "SANO", notas: "Parto sin complicaciones, cría es Canela C006" },
      { animalId: reina.id, fecha: new Date("2024-08-05"), tipoParto: "NORMAL", crias: 1, sexoCria: "MACHO", pesoAlNacer: 28, estadoCria: "SANO", notas: "Parto asistido, cría es Pinto C007" },
    ],
  });
  console.log("✅ 2 partos registrados");

  // ── 11. MOVIMIENTOS DE POTRERO (3) ────────────────────────────
  const hace20 = new Date(Date.now() - 20 * 86400000);
  const hace5  = new Date(Date.now() -  5 * 86400000);
  await prisma.movimientoPotrero.createMany({
    data: [
      { loteId: loteLeche.id, potreroId: potreroNorte.id, fechaEntrada: hace5, motivo: "Rotación programada", notas: "Pasto en excelente estado" },
      { loteId: loteEngorde.id, potreroId: potreroCentro.id, fechaEntrada: hace20, fechaSalida: hace5, diasEnPotrero: 15, motivo: "Rotación programada" },
      { loteId: loteLeche.id, potreroId: potreroSur.id, fechaEntrada: new Date(Date.now() - 40 * 86400000), fechaSalida: hace20, diasEnPotrero: 20, motivo: "Pastoreo inicial" },
    ],
  });
  console.log("✅ 3 movimientos de potrero creados");

  // ── 12. PARCELAS (2) ──────────────────────────────────────────
  const parcelaCafe = await prisma.parcela.create({
    data: { nombre: "Parcela Café Altura", tipo: "CULTIVO", numero: 1, areaHectareas: 4.5, fincaId: finca.id },
  });
  const parcelaPlantano = await prisma.parcela.create({
    data: { nombre: "Parcela Plátano", tipo: "CULTIVO", numero: 2, areaHectareas: 2.0, fincaId: finca.id },
  });
  console.log("✅ 2 parcelas creadas");

  // ── 13. CULTIVOS (3) ──────────────────────────────────────────
  const cultivoCafe = await prisma.cultivo.create({
    data: { tipo: "CAFE", variedad: "Catuaí Rojo", fechaSiembra: new Date("2021-08-01"), etapa: "FRUCTIFICACION", areaHectareas: 4.5, estado: "ACTIVO", parcelaId: parcelaCafe.id, notas: "Producción estimada 15 fanegas" },
  });
  const cultivoPlantano = await prisma.cultivo.create({
    data: { tipo: "PLATANO", variedad: "Curraré", fechaSiembra: new Date("2024-03-15"), fechaCosecha: new Date("2025-09-15"), etapa: "CRECIMIENTO", areaHectareas: 2.0, estado: "ACTIVO", parcelaId: parcelaPlantano.id },
  });
  const cultivoMaiz = await prisma.cultivo.create({
    data: { tipo: "MAIZ", variedad: "Diamante 8843", fechaSiembra: new Date("2025-01-10"), fechaCosecha: new Date("2025-05-10"), etapa: "FRUCTIFICACION", areaHectareas: 1.5, estado: "ACTIVO", parcelaId: parcelaPlantano.id },
  });
  console.log("✅ 3 cultivos creados");

  // ── 14. LABORES AGRÍCOLAS (4) ─────────────────────────────────
  await prisma.laborAgricola.createMany({
    data: [
      { cultivoId: cultivoCafe.id, tipo: "FERTILIZACION", producto: "18-5-15-6S", cantidad: 120, unidad: "kg", costo: 48000, realizado: true, fecha: new Date("2025-02-20"), notas: "Fertilización de inicio de ciclo" },
      { cultivoId: cultivoCafe.id, tipo: "CONTROL_PLAGAS", producto: "Trichoderma", cantidad: 5, unidad: "litros", costo: 15000, realizado: true, fecha: new Date("2025-03-10") },
      { cultivoId: cultivoPlantano.id, tipo: "RIEGO", producto: "Agua por goteo", costo: 0, realizado: true, fecha: new Date("2025-04-01") },
      { cultivoId: cultivoMaiz.id, tipo: "FUMIGACION", producto: "Glifosato", cantidad: 3, unidad: "litros", costo: 9000, realizado: false, fecha: new Date("2025-05-15"), notas: "Programado para control de maleza" },
    ],
  });
  console.log("✅ 4 labores agrícolas creadas");

  // ── 15. TAREAS (6) ────────────────────────────────────────────
  await prisma.tarea.createMany({
    data: [
      { titulo: "Revisar cerca eléctrica del Potrero La Cañada", descripcion: "Hay un poste caído en el sector sur", prioridad: "ALTA", estado: "PENDIENTE", categoria: "INFRAESTRUCTURA", fincaId: finca.id, peonId: peon1.id, fechaLimite: new Date() },
      { titulo: "Desparasitar Lote Lechero", descripcion: "Aplicar Ivermectina 5ml subcutáneo a todo el lote", prioridad: "ALTA", estado: "EN_PROCESO", categoria: "VETERINARIA", fincaId: finca.id, peonId: peon1.id, fechaLimite: new Date(Date.now() + 2 * 86400000) },
      { titulo: "Aplicar AD3E a terneros", prioridad: "MEDIA", estado: "PENDIENTE", categoria: "VETERINARIA", fincaId: finca.id, peonId: peon2.id, fechaLimite: new Date(Date.now() + 5 * 86400000) },
      { titulo: "Fertilizar café con 18-5-15", prioridad: "MEDIA", estado: "COMPLETADA", categoria: "CULTIVO", fincaId: finca.id, peonId: peon2.id, completadaEn: new Date("2025-02-20") },
      { titulo: "Rotar Lote Lechero a Potrero El Bosque", descripcion: "Ya cumplió 7 días en La Ladera", prioridad: "BAJA", estado: "COMPLETADA", categoria: "POTRERO", fincaId: finca.id, peonId: peon1.id, completadaEn: hace5 },
      { titulo: "Revisar producción de leche mensual", prioridad: "BAJA", estado: "PENDIENTE", categoria: "ANIMAL", fincaId: finca.id, frecuencia: "MENSUAL", tipo: "RECURRENTE", fechaLimite: new Date(Date.now() + 10 * 86400000) },
    ],
  });
  console.log("✅ 6 tareas creadas");

  // ── 16. INVENTARIO (4 ítems) ──────────────────────────────────
  const tractor = await prisma.inventarioItem.create({
    data: { nombre: "Tractor Mahindra 4540", categoria: "MAQUINARIA", marca: "Mahindra", modelo: "4540", numeroSerie: "MH2023001", estado: "BUENO", cantidad: 1, unidad: "unidad", ultimoMantenimiento: new Date("2025-01-15"), proximoMantenimiento: new Date("2025-07-15"), costoAdquisicion: 12000000, fincaId: finca.id },
  });
  const bomba = await prisma.inventarioItem.create({
    data: { nombre: "Bomba de mochila Honda", categoria: "HERRAMIENTA_ELECTRICA", marca: "Honda", estado: "BUENO", cantidad: 2, unidad: "unidad", costoAdquisicion: 180000, fincaId: finca.id },
  });
  await prisma.inventarioItem.create({
    data: { nombre: "Ivermectina 1%", categoria: "INSUMO", estado: "BUENO", cantidad: 5, unidad: "litros", cantidadMinima: 2, costoAdquisicion: 16000, fincaId: finca.id },
  });
  await prisma.inventarioItem.create({
    data: { nombre: "Fertilizante 18-5-15", categoria: "INSUMO", estado: "BUENO", cantidad: 200, unidad: "kg", cantidadMinima: 50, costoAdquisicion: 400, fincaId: finca.id, notas: "Precio por kg" },
  });
  console.log("✅ 4 ítems de inventario creados");

  // ── 17. MANTENIMIENTO (2) ─────────────────────────────────────
  await prisma.mantenimientoRegistro.createMany({
    data: [
      { itemId: tractor.id, tipo: "CAMBIO_ACEITE", descripcion: "Cambio de aceite y filtros", fecha: new Date("2025-01-15"), costo: 85000, realizadoPor: "Taller Agro San Ramón", proximaFecha: new Date("2025-07-15") },
      { itemId: bomba.id, tipo: "REVISION", descripcion: "Revisión general y limpieza de filtros", fecha: new Date("2025-03-01"), costo: 15000, realizadoPor: "Marcos Solís" },
    ],
  });
  console.log("✅ 2 registros de mantenimiento creados");

  // ── 18. PRODUCCIÓN DE LECHE (5) ───────────────────────────────
  const diasAtras = [5, 4, 3, 2, 1];
  await Promise.all(diasAtras.map(d =>
    prisma.registroLeche.create({
      data: {
        fecha: new Date(Date.now() - d * 86400000),
        litros: parseFloat((18 + Math.random() * 6).toFixed(1)),
        animalesOrdenados: 4,
        fincaId: finca.id,
        loteId: loteLeche.id,
        notas: d === 3 ? "Lluvia afectó producción" : undefined,
      },
    })
  ));
  console.log("✅ 5 registros de leche creados");

  // ── 19. REGISTROS DE PESO (3) ─────────────────────────────────
  await prisma.registroPeso.createMany({
    data: [
      { animalId: estrella.id, fincaId: finca.id, pesoKg: 575, metodo: "BASCULA", fecha: new Date("2025-04-01"), notas: "Peso antes del celo" },
      { animalId: animales[3].id, fincaId: finca.id, pesoKg: 840, metodo: "BASCULA", fecha: new Date("2025-04-01") },
      { animalId: animales[6].id, fincaId: finca.id, pesoKg: 92, metodo: "CINTA", fecha: new Date("2025-03-15"), notas: "Ternero en buen desarrollo" },
    ],
  });
  console.log("✅ 3 registros de peso creados");

  // ── 20. TRANSACCIONES FINANCIERAS (6) ─────────────────────────
  await prisma.transaccion.createMany({
    data: [
      { fincaId: finca.id, tipo: "INGRESO", categoria: "VENTA_LECHE", monto: 285000, descripcion: "Venta leche — COOPELECHE semana 17", fecha: new Date("2025-04-28") },
      { fincaId: finca.id, tipo: "INGRESO", categoria: "VENTA_LECHE", monto: 295000, descripcion: "Venta leche — COOPELECHE semana 18", fecha: new Date("2025-05-05") },
      { fincaId: finca.id, tipo: "EGRESO", categoria: "VETERINARIO", monto: 35000, descripcion: "Visita Dr. Ana Castro — diagnóstico mastitis Paloma", fecha: new Date("2025-04-28") },
      { fincaId: finca.id, tipo: "EGRESO", categoria: "SALARIO", monto: 730000, descripcion: "Planilla quincenal Rodrigo + Marcos", fecha: new Date("2025-04-30") },
      { fincaId: finca.id, tipo: "EGRESO", categoria: "MANTENIMIENTO", monto: 85000, descripcion: "Cambio aceite Tractor Mahindra", fecha: new Date("2025-01-15") },
      { fincaId: finca.id, tipo: "INGRESO", categoria: "VENTA_CULTIVO", monto: 450000, descripcion: "Venta 3 fanegas café a COOCAFÉ", fecha: new Date("2025-03-20"), animalCodigo: undefined, animalNombre: undefined },
    ],
  });
  console.log("✅ 6 transacciones financieras creadas");

  // ── 21. NOTIFICACIONES (3) ────────────────────────────────────
  await prisma.notificacion.createMany({
    data: [
      { userId: carlos.id, titulo: "⚠️ Mastitis detectada — Paloma", mensaje: "El animal C008 (Paloma) fue diagnosticado con mastitis. Tiene tratamiento activo hasta el 7 de mayo.", tipo: "VACUNA", leida: false, accion: "/animales" },
      { userId: carlos.id, titulo: "🔄 Rotación de potrero pendiente", mensaje: "El Lote Lechero lleva 5 días en Potrero El Bosque. Máximo recomendado: 7 días.", tipo: "ROTACION", leida: false, accion: "/potreros" },
      { userId: carlos.id, titulo: "📅 Próxima vacuna — Estrella", mensaje: "La vaca Estrella (C001) tiene vacuna de Fiebre Aftosa programada para el 01/09/2025.", tipo: "VACUNA", leida: true, accion: "/animales" },
    ],
  });
  console.log("✅ 3 notificaciones creadas");

  // ── 22. CROQUIS ───────────────────────────────────────────────
  await prisma.croquis.create({
    data: {
      fincaId: finca.id,
      data: JSON.stringify({
        version: "1.0",
        width: 800, height: 600,
        shapes: [
          { id: "p1", type: "rect", x: 50,  y: 50,  width: 200, height: 150, fill: "#bbf7d0", label: "Potrero El Bosque" },
          { id: "p2", type: "rect", x: 300, y: 50,  width: 250, height: 200, fill: "#fef08a", label: "Potrero La Ladera" },
          { id: "p3", type: "rect", x: 50,  y: 250, width: 150, height: 120, fill: "#fed7aa", label: "Potrero La Cañada" },
          { id: "c1", type: "rect", x: 300, y: 300, width: 180, height: 130, fill: "#c7d2fe", label: "Parcela Café Altura" },
          { id: "c2", type: "rect", x: 500, y: 300, width: 130, height: 100, fill: "#fce7f3", label: "Parcela Plátano/Maíz" },
          { id: "h1", type: "rect", x: 600, y: 50,  width: 100, height: 80,  fill: "#e5e7eb", label: "Casa/Bodega" },
        ],
      }),
      thumbnail: null,
    },
  });
  console.log("✅ Croquis de la finca creado");

  // ── RESUMEN ───────────────────────────────────────────────────
  console.log("\n🎉 ¡Todo listo para Carlos Vega!");
  console.log("═══════════════════════════════════════════════");
  console.log("📧 Email:      carlos.vegaalfaro815@gmail.com");
  console.log("🔑 Contraseña: carlos1234");
  console.log("🌿 Finca:      Finca El Paraíso — San Ramón, Alajuela");
  console.log("📊 Creados:");
  console.log("   • 1 usuario + 1 suscripción PRO");
  console.log("   • 1 finca + croquis");
  console.log("   • 2 peones");
  console.log("   • 3 potreros + 2 lotes");
  console.log("   • 10 animales (vacas, toros, terneros, caballos)");
  console.log("   • 8 historiales médicos");
  console.log("   • 3 celos + 2 partos");
  console.log("   • 3 movimientos de potrero");
  console.log("   • 2 parcelas + 3 cultivos + 4 labores agrícolas");
  console.log("   • 6 tareas");
  console.log("   • 4 ítems de inventario + 2 mantenimientos");
  console.log("   • 5 registros de leche + 3 registros de peso");
  console.log("   • 6 transacciones financieras");
  console.log("   • 3 notificaciones");
  console.log("═══════════════════════════════════════════════");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
