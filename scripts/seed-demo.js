const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ 
    where: { fincas: { some: {} } },
    include: { fincas: true } 
  });
  if (!user || !user.fincas[0]) { console.log('No user/finca found'); return; }
  
  const fincaId = user.fincas[0].id;
  console.log('Seeding finca: ' + user.fincas[0].nombre + ' (' + fincaId + ')');

  // PEONES
  await Promise.all([
    prisma.peon.upsert({ where: { id: 'peon-demo-1' }, create: { id: 'peon-demo-1', fincaId, nombre: 'José Ramírez', cedula: '1-0234-5678', cargo: 'VAQUERO', telefono: '8801-1234', salario: 450000, fechaContratacion: new Date('2022-03-15'), estado: 'ACTIVO', notas: 'Encargado del ordeño matutino' }, update: {} }),
    prisma.peon.upsert({ where: { id: 'peon-demo-2' }, create: { id: 'peon-demo-2', fincaId, nombre: 'Miguel Angel Soto', cedula: '2-0456-7890', cargo: 'PEON', telefono: '8812-5678', salario: 380000, fechaContratacion: new Date('2023-07-01'), estado: 'ACTIVO', notas: 'Labores generales y riego' }, update: {} }),
    prisma.peon.upsert({ where: { id: 'peon-demo-3' }, create: { id: 'peon-demo-3', fincaId, nombre: 'Carlos Hernandez', cedula: '3-0567-8901', cargo: 'ENCARGADO', telefono: '8823-9012', salario: 550000, fechaContratacion: new Date('2020-01-10'), estado: 'ACTIVO', notas: 'Encargado general cuando el dueno no esta' }, update: {} }),
    prisma.peon.upsert({ where: { id: 'peon-demo-4' }, create: { id: 'peon-demo-4', fincaId, nombre: 'Andres Jimenez', cedula: '4-0678-9012', cargo: 'OPERADOR', telefono: '8834-3456', salario: 420000, fechaContratacion: new Date('2021-11-20'), estado: 'ACTIVO', notas: 'Manejo de maquinaria y tractor' }, update: {} }),
  ]);
  console.log('Peones OK');

  // POTREROS
  await Promise.all([
    prisma.potrero.upsert({ where: { id: 'potrero-demo-1' }, create: { id: 'potrero-demo-1', fincaId, nombre: 'Potrero Norte', numero: 1, areHectareas: 3.5, disponible: false, tipoUso: 'CRIA', capacidadAnimales: 20, estadoPasto: 'BUENO', notas: 'Pasto estrella africana, con bebedero y sombra de arboles' }, update: {} }),
    prisma.potrero.upsert({ where: { id: 'potrero-demo-2' }, create: { id: 'potrero-demo-2', fincaId, nombre: 'Potrero Sur', numero: 2, areHectareas: 5.0, disponible: false, tipoUso: 'ENGORDE', capacidadAnimales: 30, estadoPasto: 'EXCELENTE', notas: 'Pasto jaragua, terreno plano ideal para engorde' }, update: {} }),
    prisma.potrero.upsert({ where: { id: 'potrero-demo-3' }, create: { id: 'potrero-demo-3', fincaId, nombre: 'Potrero Este', numero: 3, areHectareas: 2.8, disponible: true, tipoUso: 'LECHE', capacidadAnimales: 15, estadoPasto: 'DESCANSANDO', notas: 'En descanso para recuperacion del pasto' }, update: {} }),
    prisma.potrero.upsert({ where: { id: 'potrero-demo-4' }, create: { id: 'potrero-demo-4', fincaId, nombre: 'Potrero Maternidad', numero: 4, areHectareas: 1.5, disponible: false, tipoUso: 'CRIA', capacidadAnimales: 8, estadoPasto: 'BUENO', notas: 'Dedicado a vacas prenadas y terneros recien nacidos' }, update: {} }),
  ]);
  console.log('Potreros OK');

  // LOTES
  await Promise.all([
    prisma.lote.upsert({ where: { id: 'lote-demo-1' }, create: { id: 'lote-demo-1', fincaId, nombre: 'Lote A - Novillas', descripcion: 'Grupo de novillas jovenes para engorde', tipo: 'ENGORDE', color: '#F59E0B', activo: true }, update: {} }),
    prisma.lote.upsert({ where: { id: 'lote-demo-2' }, create: { id: 'lote-demo-2', fincaId, nombre: 'Lote B - Vacas Paridas', descripcion: 'Vacas en produccion de leche', tipo: 'LECHE', color: '#3B82F6', activo: true }, update: {} }),
    prisma.lote.upsert({ where: { id: 'lote-demo-3' }, create: { id: 'lote-demo-3', fincaId, nombre: 'Lote C - Maternidad', descripcion: 'Vacas prenadas proximas a parir', tipo: 'CRIA', color: '#EC4899', activo: true }, update: {} }),
    prisma.lote.upsert({ where: { id: 'lote-demo-4' }, create: { id: 'lote-demo-4', fincaId, nombre: 'Lote D - Toretes', descripcion: 'Toretes de 18 meses en crecimiento', tipo: 'ENGORDE', color: '#8B5CF6', activo: true }, update: {} }),
  ]);
  console.log('Lotes OK');

  // ANIMALES
  await Promise.all([
    prisma.animal.upsert({ where: { fincaId_codigo: { fincaId, codigo: 'VCA-001' } }, create: { id: 'animal-demo-1', fincaId, codigo: 'VCA-001', nombre: 'Esperanza', tipo: 'VACA', sexo: 'HEMBRA', raza: 'Holstein', edadMeses: 50, pesoEstimado: 520, estado: 'ACTIVO', loteId: 'lote-demo-2', notas: 'Excelente productora, 18 litros/dia' }, update: {} }),
    prisma.animal.upsert({ where: { fincaId_codigo: { fincaId, codigo: 'VCA-002' } }, create: { id: 'animal-demo-2', fincaId, codigo: 'VCA-002', nombre: 'Mariposa', tipo: 'VACA', sexo: 'HEMBRA', raza: 'Jersey', edadMeses: 60, pesoEstimado: 450, estado: 'PRENADA', loteId: 'lote-demo-3', notas: 'Prenada, parto estimado en 3 semanas' }, update: {} }),
    prisma.animal.upsert({ where: { fincaId_codigo: { fincaId, codigo: 'TOR-001' } }, create: { id: 'animal-demo-3', fincaId, codigo: 'TOR-001', nombre: 'Rayo', tipo: 'TORO', sexo: 'MACHO', raza: 'Brahman', edadMeses: 42, pesoEstimado: 680, estado: 'ACTIVO', notas: 'Toro reproductor, buena genetica' }, update: {} }),
    prisma.animal.upsert({ where: { fincaId_codigo: { fincaId, codigo: 'NVL-001' } }, create: { id: 'animal-demo-4', fincaId, codigo: 'NVL-001', nombre: 'Canela', tipo: 'NOVILLA', sexo: 'HEMBRA', raza: 'Pardo Suizo', edadMeses: 20, pesoEstimado: 280, estado: 'ACTIVO', loteId: 'lote-demo-1', notas: 'Novilla de reemplazo, buen desarrollo' }, update: {} }),
    prisma.animal.upsert({ where: { fincaId_codigo: { fincaId, codigo: 'VCA-003' } }, create: { id: 'animal-demo-5', fincaId, codigo: 'VCA-003', nombre: 'Lucera', tipo: 'VACA', sexo: 'HEMBRA', raza: 'Holstein', edadMeses: 72, pesoEstimado: 560, estado: 'EN_TRATAMIENTO', loteId: 'lote-demo-2', notas: 'En tratamiento por mastitis leve' }, update: {} }),
    prisma.animal.upsert({ where: { fincaId_codigo: { fincaId, codigo: 'TRN-001' } }, create: { id: 'animal-demo-6', fincaId, codigo: 'TRN-001', nombre: 'Tordillo', tipo: 'TERNERO', sexo: 'MACHO', raza: 'Holstein x Brahman', edadMeses: 3, pesoEstimado: 95, estado: 'ACTIVO', loteId: 'lote-demo-3', notas: 'Ternero recien destetado' }, update: {} }),
  ]);
  console.log('Animales OK');

  // PARCELAS
  await Promise.all([
    prisma.parcela.upsert({ where: { id: 'parcela-demo-1' }, create: { id: 'parcela-demo-1', fincaId, nombre: 'Parcela Cafe 1', areaHectareas: 1.2, tipo: 'CULTIVO', notas: 'Ladera norte, buen drenaje' }, update: {} }),
    prisma.parcela.upsert({ where: { id: 'parcela-demo-2' }, create: { id: 'parcela-demo-2', fincaId, nombre: 'Parcela Platano', areaHectareas: 0.8, tipo: 'CULTIVO', notas: 'Zona baja con humedad' }, update: {} }),
    prisma.parcela.upsert({ where: { id: 'parcela-demo-3' }, create: { id: 'parcela-demo-3', fincaId, nombre: 'Parcela Maiz', areaHectareas: 0.5, tipo: 'CULTIVO', notas: 'Terreno abierto para grano' }, update: {} }),
    prisma.parcela.upsert({ where: { id: 'parcela-demo-4' }, create: { id: 'parcela-demo-4', fincaId, nombre: 'Parcela Yuca', areaHectareas: 0.4, tipo: 'CULTIVO', notas: 'Para consumo propio y alimentacion animal' }, update: {} }),
  ]);
  console.log('Parcelas OK');

  // CULTIVOS
  await Promise.all([
    prisma.cultivo.upsert({ where: { id: 'cultivo-demo-1' }, create: { id: 'cultivo-demo-1', parcelaId: 'parcela-demo-1', tipo: 'CAFE', variedad: 'Catuai', areaHectareas: 1.2, fechaSiembra: new Date('2021-06-15'), etapa: 'FRUCTIFICACION', estado: 'ACTIVO', notas: 'Produccion de 12 fanegas por cosecha. Proxima cosecha en octubre.' }, update: {} }),
    prisma.cultivo.upsert({ where: { id: 'cultivo-demo-2' }, create: { id: 'cultivo-demo-2', parcelaId: 'parcela-demo-2', tipo: 'PLATANO', variedad: 'Cuerno', areaHectareas: 0.8, fechaSiembra: new Date('2023-02-10'), etapa: 'FRUCTIFICACION', estado: 'ACTIVO', notas: 'Produccion mensual de 4 racimos aprox.' }, update: {} }),
    prisma.cultivo.upsert({ where: { id: 'cultivo-demo-3' }, create: { id: 'cultivo-demo-3', parcelaId: 'parcela-demo-3', tipo: 'MAIZ', variedad: 'Hibrido H5', areaHectareas: 0.5, fechaSiembra: new Date('2026-02-20'), etapa: 'CRECIMIENTO', estado: 'ACTIVO', notas: 'Tercer ciclo, para ensilaje y alimentacion del ganado.' }, update: {} }),
    prisma.cultivo.upsert({ where: { id: 'cultivo-demo-4' }, create: { id: 'cultivo-demo-4', parcelaId: 'parcela-demo-4', tipo: 'YUCA', variedad: 'Valencia', areaHectareas: 0.4, fechaSiembra: new Date('2025-11-01'), etapa: 'COSECHA', estado: 'ACTIVO', notas: 'Lista para cosechar pronto.' }, update: {} }),
  ]);
  console.log('Cultivos OK');

  // TAREAS
  const hoy = new Date();
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);
  const en3dias = new Date(hoy); en3dias.setDate(hoy.getDate() + 3);
  const en7dias = new Date(hoy); en7dias.setDate(hoy.getDate() + 7);
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);

  await Promise.all([
    prisma.tarea.upsert({ where: { id: 'tarea-demo-1' }, create: { id: 'tarea-demo-1', fincaId, peonId: 'peon-demo-1', titulo: 'Revisar bebederos potreros Norte y Sur', descripcion: 'Verificar que todos los bebederos esten llenos y limpios. Revisar valvulas flotadoras y limpiar algas.', prioridad: 'ALTA', estado: 'PENDIENTE', categoria: 'POTRERO', fechaLimite: manana, recordatorio: true }, update: {} }),
    prisma.tarea.upsert({ where: { id: 'tarea-demo-2' }, create: { id: 'tarea-demo-2', fincaId, peonId: 'peon-demo-2', titulo: 'Aplicar desparasitante al Lote A', descripcion: 'Aplicar Ivermectina 1% subcutanea a todas las novillas del Lote A. Dosis segun peso estimado.', prioridad: 'URGENTE', estado: 'PENDIENTE', categoria: 'VETERINARIA', fechaLimite: hoy, recordatorio: true }, update: {} }),
    prisma.tarea.upsert({ where: { id: 'tarea-demo-3' }, create: { id: 'tarea-demo-3', fincaId, peonId: 'peon-demo-3', titulo: 'Fertilizar parcela de cafe', descripcion: 'Aplicar formula 10-30-10 en corona. 200 gramos por arbol. Hacerlo con humedad en el suelo.', prioridad: 'MEDIA', estado: 'EN_PROCESO', categoria: 'CULTIVO', fechaLimite: en3dias, recordatorio: true }, update: {} }),
    prisma.tarea.upsert({ where: { id: 'tarea-demo-4' }, create: { id: 'tarea-demo-4', fincaId, peonId: 'peon-demo-1', titulo: 'Ordeno matutino - Lote B', descripcion: 'Ordeno de las 5:30am. Registrar produccion individual. Revisar posibles casos de mastitis.', prioridad: 'ALTA', estado: 'COMPLETADA', categoria: 'ANIMAL', fechaLimite: hoy, completadaEn: new Date(), recordatorio: false }, update: {} }),
    prisma.tarea.upsert({ where: { id: 'tarea-demo-5' }, create: { id: 'tarea-demo-5', fincaId, peonId: 'peon-demo-4', titulo: 'Revisar cercas electricas sector este', descripcion: 'Verificar tension de alambre y funcionamiento del energizador. Reemplazar postes danados.', prioridad: 'MEDIA', estado: 'PENDIENTE', categoria: 'INFRAESTRUCTURA', fechaLimite: en7dias, recordatorio: true }, update: {} }),
    prisma.tarea.upsert({ where: { id: 'tarea-demo-6' }, create: { id: 'tarea-demo-6', fincaId, titulo: 'Comprar sal mineral y vitaminas', descripcion: 'Comprar 2 sacos de sal mineralizada y 10 dosis de vitamina ADE. Ir a AgroAlfa en San Carlos.', prioridad: 'ALTA', estado: 'VENCIDA', categoria: 'ADMINISTRATIVA', fechaLimite: ayer, recordatorio: true }, update: {} }),
    prisma.tarea.upsert({ where: { id: 'tarea-demo-7' }, create: { id: 'tarea-demo-7', fincaId, peonId: 'peon-demo-2', titulo: 'Limpiar canales de platano', descripcion: 'Deschante y limpieza de arvenses en la parcela de platano. Aplicar fungicida preventivo Mancozeb.', prioridad: 'BAJA', estado: 'PENDIENTE', categoria: 'CULTIVO', fechaLimite: en7dias, recordatorio: true }, update: {} }),
    prisma.tarea.upsert({ where: { id: 'tarea-demo-8' }, create: { id: 'tarea-demo-8', fincaId, peonId: 'peon-demo-3', titulo: 'Tratamiento mastitis - vaca Lucera', descripcion: 'Aplicar segunda dosis de Cepravin intramamario. Revisar temperatura corporal y produccion de leche.', prioridad: 'URGENTE', estado: 'PENDIENTE', categoria: 'VETERINARIA', fechaLimite: hoy, recordatorio: true }, update: {} }),
  ]);
  console.log('Tareas OK');

  // HISTORIAL MEDICO
  await Promise.all([
    prisma.historialMedico.upsert({ where: { id: 'hist-demo-1' }, create: { id: 'hist-demo-1', animalId: 'animal-demo-5', tipo: 'MEDICAMENTO', producto: 'Cepravin intramamario', dosis: '1 jeringa intramam.', viaAdministracion: 'Intramamario', fecha: new Date(Date.now() - 2*24*60*60*1000), proximaFecha: manana, veterinario: 'Dr. Morales', notas: 'Mastitis subclinica cuarto delantero izquierdo. Revisar evolucion en 48h' }, update: {} }),
    prisma.historialMedico.upsert({ where: { id: 'hist-demo-2' }, create: { id: 'hist-demo-2', animalId: 'animal-demo-1', tipo: 'VACUNA', producto: 'Aftovax + Rabia BV', dosis: '5ml SC', viaAdministracion: 'Subcutanea', fecha: new Date(Date.now() - 30*24*60*60*1000), proximaFecha: new Date(Date.now() + 150*24*60*60*1000), veterinario: 'Dr. Morales', notas: 'Vacuna aftosa y rabia bovina. Sin reacciones adversas' }, update: {} }),
    prisma.historialMedico.upsert({ where: { id: 'hist-demo-3' }, create: { id: 'hist-demo-3', animalId: 'animal-demo-2', tipo: 'VITAMINA', producto: 'AD3E Forte', dosis: '10ml IM', viaAdministracion: 'Intramuscular', fecha: new Date(Date.now() - 7*24*60*60*1000), notas: 'Suplemento vitaminico prenatal. Vaca en buen estado general' }, update: {} }),
  ]);
  console.log('Historial OK');

  console.log('\nDemo data creada correctamente!');
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
