import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const assetName = "GRE-FPKH-0030";
  console.log(`Searching for asset with nama: "${assetName}"...`);
  
  const asset = await prisma.masterAsset.findFirst({
    where: { nama: assetName },
    include: {
      complaints: {
        orderBy: { tanggalPengerjaan: "asc" }
      }
    }
  });

  if (!asset) {
    console.error(`Asset dengan nama "${assetName}" tidak ditemukan!`);
    process.exit(1);
  }

  console.log(`Asset ditemukan! ID: ${asset.id}, Kategori: ${asset.kategori}, Tipe: ${asset.tipe}`);
  
  const complaints = asset.complaints || [];
  const totalKomplain = complaints.length;
  console.log(`Total komplain historis: ${totalKomplain}`);

  const sevMap: Record<string, number> = {
    'Ringan': 1, 'Sedang': 2, 'Berat': 3, 'Fatal': 4,
    'Rendah': 1, 'Tinggi': 3, 'Kritis': 4,
    'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4
  };

  const biayaTotal = complaints.reduce((sum, c) => sum + c.biayaPerbaikan, 0);
  const biayaMean = totalKomplain > 0 ? biayaTotal / totalKomplain : 0;

  // Hitung rata-rata hari antar komplain
  let intervalSum = 0;
  let validIntervals = 0;
  for (let i = 1; i < totalKomplain; i++) {
    const tPrev = complaints[i - 1].tanggalPengerjaan;
    const tCurr = complaints[i].tanggalPengerjaan;
    if (tPrev && tCurr) {
      const diffDays = Math.floor((new Date(tCurr).getTime() - new Date(tPrev).getTime()) / (1000 * 60 * 60 * 24));
      intervalSum += diffDays;
      validIntervals++;
    }
  }
  const hariAntarKomplainMean = validIntervals > 0 ? intervalSum / validIntervals : 0.0;

  // Hitung umur aset
  const installDate = new Date(asset.tanggalInstalasi);
  const ageToday = Math.max(1, Math.floor((new Date().getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  let ageAtComplaint = ageToday;
  const lastComp = complaints[totalKomplain - 1];
  if (lastComp && lastComp.tanggalPengerjaan) {
    ageAtComplaint = Math.max(1, Math.floor((new Date(lastComp.tanggalPengerjaan).getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // Hitung severity stats
  const severities = complaints.map(c => sevMap[c.severity] || 1);
  const severityMean = severities.length > 0 ? severities.reduce((sum, s) => sum + s, 0) / severities.length : 1.0;
  const severityMax = severities.length > 0 ? Math.max(...severities) : 1.0;

  const complaintVelocity = totalKomplain / ageToday;

  const features = {
    kategori: asset.kategori,
    sub_kategori: asset.subKategori,
    tipe: asset.tipe,
    merek: asset.merek,
    tingkat_kekritisan: asset.tingkatKekritisan,
    total_komplain: totalKomplain,
    biaya_total: biayaTotal,
    biaya_mean: biayaMean,
    hari_antar_komplain_mean: hariAntarKomplainMean,
    umur_saat_ini: ageToday,
    umur_saat_komplain_terakhir: ageAtComplaint,
    Severity_Mean: severityMean,
    Severity_Max: severityMax,
    complaint_velocity: complaintVelocity
  };

  console.log("\nCompiled features untuk RUL prediction:");
  console.log(JSON.stringify(features, null, 2));

  console.log("\nMemanggil FastAPI RUL Model...");
  try {
    const pyRes = await fetch("http://127.0.0.1:8000/api/predict/rul", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asset_id: asset.id,
        features,
      }),
    });

    if (pyRes.ok) {
      const result = await pyRes.json();
      console.log("\nSuccess! Hasil Prediksi RUL:");
      console.log(JSON.stringify(result, null, 2));
      
      const newRUL = Math.round(result.predicted_rul_days);
      const newEstimasi = new Date();
      newEstimasi.setDate(newEstimasi.getDate() + newRUL);
      console.log(`\nEstimasi RUL Baru: ${newRUL} Hari`);
      console.log(`Estimasi Tanggal Penggantian Baru: ${newEstimasi.toLocaleDateString('id-ID')}`);
    } else {
      console.error(`Gagal mendapatkan prediksi. Status: ${pyRes.status} - ${pyRes.statusText}`);
      const errText = await pyRes.text();
      console.error(errText);
    }
  } catch (error) {
    console.error("Terjadi error saat menghubungi FastAPI server:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
