const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('SELESAI:', await prisma.assetComplaint.count({ where: { statusTiket: 'SELESAI' } }));
  console.log('DITOLAK:', await prisma.assetComplaint.count({ where: { statusTiket: 'DITOLAK' } }));
}
main().catch(console.error).finally(async () => { await prisma.$disconnect(); });
