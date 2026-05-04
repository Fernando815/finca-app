import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Sembrando datos iniciales...");

  // Admin
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@fincaapp.cr" },
    update: {},
    create: {
      name: "Admin FincaApp",
      email: "admin@fincaapp.cr",
      password: adminHash,
      role: "ADMIN",
      suscripcion: { create: { plan: "PRO", estado: "ACTIVA" } },
    },
  });

  // Productor demo
  const demoHash = await bcrypt.hash("demo1234", 12);
  const productor = await prisma.user.upsert({
    where: { email: "demo@fincaapp.cr" },
    update: {},
    create: {
      name: "Juan Pérez",
      email: "demo@fincaapp.cr",
      password: demoHash,
      role: "PRODUCTOR",
      suscripcion: { create: { plan: "BASICO", estado: "ACTIVA" } },
    },
  });

  // Finca demo
  const finca = await prisma.finca.upsert({
    where: { id: "finca-demo" },
    update: {},
    create: {
      id: "finca-demo",
      nombre: "Finca La Esperanza",
      provincia: "Alajuela",
      canton: "San Carlos",
      areaTotal: 50,
      enfoque: "MIXTA",
      userId: productor.id,
    },
  });

  // Potreros
  const potrero1 = await prisma.potrero.create({
    data: {
      nombre: "Potrero Norte",
      numero: 1,
      areHectareas: 5.0,
      capacidadAnimales: 15,
      tipoUso: "LECHE",
      estadoPasto: "BUENO",
      diasOcupacionMaximo: 7,
      diasDescansoMinimo: 28,
      fincaId: finca.id,
    },
  });

  const potrero2 = await prisma.potrero.create({
    data: {
      nombre: "Potrero Sur",
      numero: 2,
      areHectareas: 8.0,
      capacidadAnimales: 20,
      tipoUso: "ENGORDE",
      estadoPasto: "EXCELENTE",
      diasOcupacionMaximo: 10,
      diasDescansoMinimo: 35,
      fincaId: finca.id,
    },
  });

  // Lote
  const lote = await prisma.lote.create({
    data: { nombre: "Lote A — Lecherías", fincaId: finca.id, color: "#16a34a" },
  });

  // Animales
  const vaca1 = await prisma.animal.create({
    data: {
      codigo: "001",
      nombre: "La Manchada",
      tipo: "VACA",
      raza: "Holstein",
      sexo: "HEMBRA",
      edadMeses: 48,
      pesoEstimado: 550,
      color: "Blanca y negra",
      estado: "ACTIVO",
      enfoque: "LECHE",
      fincaId: finca.id,
      loteId: lote.id,
    },
  });

  const vaca2 = await prisma.animal.create({
    data: {
      codigo: "002",
      nombre: "La Colorada",
      tipo: "VACA",
      raza: "Brahman",
      sexo: "HEMBRA",
      edadMeses: 36,
      pesoEstimado: 480,
      estado: "PRENADA",
      enfoque: "CRIA",
      fincaId: finca.id,
      loteId: lote.id,
    },
  });

  // Historial médico
  await prisma.historialMedico.create({
    data: {
      animalId: vaca1.id,
      tipo: "VACUNA",
      producto: "Fiebre Aftosa",
      dosis: "2ml",
      viaAdministracion: "Subcutáneo",
      fecha: new Date("2024-10-01"),
      proximaFecha: new Date("2025-04-01"),
      notas: "Sin reacciones adversas",
    },
  });

  // Movimiento de potrero
  await prisma.movimientoPotrero.create({
    data: {
      loteId: lote.id,
      potreroId: potrero1.id,
      fechaEntrada: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // hace 5 días
      motivo: "Rotación programada",
    },
  });

  // Parcelas y cultivos
  const parcela = await prisma.parcela.create({
    data: { nombre: "Parcela Café", tipo: "CULTIVO", areaHectareas: 3.0, fincaId: finca.id },
  });

  await prisma.cultivo.create({
    data: {
      tipo: "CAFE",
      variedad: "Costa Rica 95",
      fechaSiembra: new Date("2022-06-01"),
      etapa: "FRUCTIFICACION",
      areaHectareas: 3.0,
      estado: "ACTIVO",
      parcelaId: parcela.id,
    },
  });

  // Tareas
  await prisma.tarea.createMany({
    data: [
      { titulo: "Revisar bebederos del potrero norte", prioridad: "ALTA", estado: "PENDIENTE", categoria: "POTRERO", fincaId: finca.id, fechaLimite: new Date() },
      { titulo: "Desparasitar lote A", prioridad: "MEDIA", estado: "PENDIENTE", categoria: "VETERINARIA", fincaId: finca.id, fechaLimite: new Date(Date.now() + 3 * 86400000) },
      { titulo: "Fertilizar parcela de café", prioridad: "BAJA", estado: "PENDIENTE", categoria: "CULTIVO", fincaId: finca.id, fechaLimite: new Date(Date.now() + 7 * 86400000) },
    ],
  });

  console.log("✅ Datos sembrados exitosamente");
  console.log("👤 Admin: admin@fincaapp.cr / admin123");
  console.log("👤 Demo:  demo@fincaapp.cr  / demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
