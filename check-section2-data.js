const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- 1. SPATIAL DATA (Gedung & Lantai) ---');
  const assets = await prisma.masterAsset.findMany({
    select: {
      lokasiGedung: true,
      lokasiLantai: true,
      sisaUmurHari: true,
      kategori: true
    }
  });

  const buildings = [...new Set(assets.map(a => a.lokasiGedung))];
  const floors = [...new Set(assets.map(a => a.lokasiLantai))];
  console.log('Gedung:', buildings);
  console.log('Lantai:', floors);

  // Group by Gedung x Lantai
  const spatialMap = {};
  assets.forEach(a => {
    const key = `${a.lokasiGedung}|${a.lokasiLantai}`;
    if (!spatialMap[key]) {
      spatialMap[key] = { total: 0, critical: 0 };
    }
    spatialMap[key].total++;
    if (a.sisaUmurHari < 7) {
      spatialMap[key].critical++;
    }
  });
  console.log('Sample Spatial Groups (Gedung | Lantai -> Total, Critical):');
  console.log(Object.entries(spatialMap).slice(0, 10).map(([k, v]) => `${k} -> Total: ${v.total}, Kritis: ${v.critical}`));

  console.log('\n--- 2. CATEGORY DATA (RUL Buckets) ---');
  const categoriesMap = {};
  assets.forEach(a => {
    if (!categoriesMap[a.kategori]) {
      categoriesMap[a.kategori] = { kritis: 0, perhatian: 0, monitor: 0, sehat: 0, total: 0 };
    }
    categoriesMap[a.kategori].total++;
    const rul = a.sisaUmurHari;
    if (rul < 7) categoriesMap[a.kategori].kritis++;
    else if (rul <= 30) categoriesMap[a.kategori].perhatian++;
    else if (rul <= 90) categoriesMap[a.kategori].monitor++;
    else categoriesMap[a.kategori].sehat++;
  });
  console.log('Categories & Buckets:', categoriesMap);

  console.log('\n--- 3. REPLACEMENT HISTORY DATA ---');
  const replacementHistory = await prisma.replacementHistory.findMany({
    select: {
      tanggalPenggantian: true,
      biayaPenggantian: true,
      kategori: true
    }
  });
  console.log('Total Replacement History:', replacementHistory.length);
  if (replacementHistory.length > 0) {
    const dates = replacementHistory.map(r => r.tanggalPenggantian);
    console.log('Min Date:', new Date(Math.min(...dates)));
    console.log('Max Date:', new Date(Math.max(...dates)));
    const totalCost = replacementHistory.reduce((s, r) => s + r.biayaPenggantian, 0);
    console.log('Total Replacement Cost:', totalCost);
  }

  console.log('\n--- 4. MAINTENANCE COST DATA (Finished Complaints) ---');
  const finishedComplaints = await prisma.assetComplaint.findMany({
    where: { statusTiket: "SELESAI" },
    select: {
      tanggalSelesai: true,
      biayaPerbaikan: true,
      kategori: true
    }
  });
  console.log('Total Finished Complaints:', finishedComplaints.length);
  if (finishedComplaints.length > 0) {
    const dates = finishedComplaints.map(c => c.tanggalSelesai).filter(Boolean);
    console.log('Min Date:', new Date(Math.min(...dates)));
    console.log('Max Date:', new Date(Math.max(...dates)));
    const totalCost = finishedComplaints.reduce((s, c) => s + c.biayaPerbaikan, 0);
    console.log('Total Maintenance Cost:', totalCost);
  }

  console.log('\n--- 5. FUTURE ESTIMATED REPLACEMENTS (Proyeksi) ---');
  const futureAssets = await prisma.masterAsset.findMany({
    where: {
      status: "Aktif",
      estimasiPenggantian: { gte: new Date() }
    },
    select: {
      estimasiPenggantian: true,
      kategori: true,
      tingkatKekritisan: true
    }
  });
  console.log('Future Estimated Replacements:', futureAssets.length);
  if (futureAssets.length > 0) {
    const dates = futureAssets.map(a => a.estimasiPenggantian);
    console.log('Min Estimasi Date:', new Date(Math.min(...dates)));
    console.log('Max Estimasi Date:', new Date(Math.max(...dates)));
  }
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); });
