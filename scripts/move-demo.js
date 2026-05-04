const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OLD_FINCA = 'finca-demo';
const NEW_FINCA = 'cmoklrjta0005kmx08oo9mmf1';

const DEMO_IDS = {
  peones:   ['peon-demo-1','peon-demo-2','peon-demo-3','peon-demo-4'],
  potreros: ['potrero-demo-1','potrero-demo-2','potrero-demo-3','potrero-demo-4'],
  lotes:    ['lote-demo-1','lote-demo-2','lote-demo-3','lote-demo-4'],
  animales: ['animal-demo-1','animal-demo-2','animal-demo-3','animal-demo-4','animal-demo-5','animal-demo-6'],
  parcelas: ['parcela-demo-1','parcela-demo-2','parcela-demo-3','parcela-demo-4'],
  tareas:   ['tarea-demo-1','tarea-demo-2','tarea-demo-3','tarea-demo-4','tarea-demo-5','tarea-demo-6','tarea-demo-7','tarea-demo-8'],
};

async function main() {
  console.log('Moviendo demo data de finca-demo a Finca Bambu (Carlos)...');

  const r1 = await prisma.peon.updateMany({ where: { id: { in: DEMO_IDS.peones }, fincaId: OLD_FINCA }, data: { fincaId: NEW_FINCA } });
  console.log('Peones actualizados: ' + r1.count);

  const r2 = await prisma.potrero.updateMany({ where: { id: { in: DEMO_IDS.potreros }, fincaId: OLD_FINCA }, data: { fincaId: NEW_FINCA } });
  console.log('Potreros actualizados: ' + r2.count);

  const r3 = await prisma.lote.updateMany({ where: { id: { in: DEMO_IDS.lotes }, fincaId: OLD_FINCA }, data: { fincaId: NEW_FINCA } });
  console.log('Lotes actualizados: ' + r3.count);

  const r4 = await prisma.animal.updateMany({ where: { id: { in: DEMO_IDS.animales }, fincaId: OLD_FINCA }, data: { fincaId: NEW_FINCA } });
  console.log('Animales actualizados: ' + r4.count);

  const r5 = await prisma.parcela.updateMany({ where: { id: { in: DEMO_IDS.parcelas }, fincaId: OLD_FINCA }, data: { fincaId: NEW_FINCA } });
  console.log('Parcelas actualizadas: ' + r5.count);

  const r6 = await prisma.tarea.updateMany({ where: { id: { in: DEMO_IDS.tareas }, fincaId: OLD_FINCA }, data: { fincaId: NEW_FINCA } });
  console.log('Tareas actualizadas: ' + r6.count);

  // Notificaciones de finca-demo que puedan existir para Carlos
  const notifs = await prisma.notificacion.updateMany({
    where: { fincaId: OLD_FINCA, userId: 'cmoklesnu0002kmx00zwyyq2c' },
    data: { fincaId: NEW_FINCA }
  });
  console.log('Notificaciones actualizadas: ' + notifs.count);

  console.log('\nListo! Los datos demo ahora pertenecen a Finca Bambu de Carlos.');
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
