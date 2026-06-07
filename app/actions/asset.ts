"use server";

import { StatusTiket, TindakanTeknisi } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

declare const process: any;

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Perbaikan langsung dari halaman aset (direct ticketing):
// 1. Update kondisi MasterAsset
// 2. Buat catatan AssetComplaint dengan status SELESAI
export async function perbaikiAset(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEKNISI") throw new Error("Unauthorized");

  const id                  = formData.get("id") as string;
  // Kondisi baru aset
  const status              = formData.get("status") as string;
  const healthStatus        = formData.get("healthStatus") as string;
  const sisaUmurHari        = parseInt(formData.get("sisaUmurHari") as string, 10);
  const estimasiPenggantian = formData.get("estimasiPenggantian") as string;
  // Detail perbaikan
  const tanggalPengerjaan   = formData.get("tanggalPengerjaan") as string;
  const tanggalSelesai      = formData.get("tanggalSelesai") as string;
  const jenisKerusakan      = formData.get("jenisKerusakan") as string;
  const severity            = formData.get("severity") as string;
  const penyebab            = formData.get("penyebab") as string;
  const biayaPerbaikan      = parseInt(formData.get("biayaPerbaikan") as string || "0", 10);
  const sparePartDigunakan  = (formData.get("sparePartDigunakan") as string) || "-";

  const aset = await prisma.masterAsset.findUnique({ where: { id } });
  if (!aset) throw new Error("Aset tidak ditemukan");

  const tiketId = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  await prisma.$transaction([
    // Update kondisi aset
    prisma.masterAsset.update({
      where: { id },
      data: {
        status,
        healthStatus,
        sisaUmurHari,
        estimasiPenggantian: new Date(estimasiPenggantian),
      },
    }),
    // Buat catatan servis langsung (direct ticketing — tanpa melalui alur komplain)
    prisma.assetComplaint.create({
      data: {
        id: tiketId,
        idAset: id,
        namaAset: aset.nama,
        kategori: aset.kategori,
        subKategori: aset.subKategori,
        tipe: aset.tipe,
        tanggalPerencanaan: new Date(),
        tanggalPengerjaan: new Date(tanggalPengerjaan),
        tanggalSelesai: new Date(tanggalSelesai),
        jenisKerusakan,
        severity,
        penyebab,
        biayaPerbaikan,
        sparePartDigunakan,
        statusTiket: StatusTiket.SELESAI,
        tindakanTeknisi: TindakanTeknisi.SERVIS,
        idTeknisi: session.user.id,
      },
    }),
  ]);

  // Recalculate RUL immediately after direct repair is recorded
  await recalculateAssetRUL(id);

  revalidatePath("/aset");
  revalidatePath("/maintenance");
  revalidatePath("/tiket");
  redirect("/maintenance");
}

export async function searchAssetsForStaging(staging: any, searchKeyword: string = "") {
  // Ambil data aset, jika search tidak kosong gunakan filter
  const q = searchKeyword.toLowerCase();
  
  const assets = await prisma.masterAsset.findMany({
    where: {
      status: "Aktif",
      ...(q ? {
        OR: [
          { nama: { contains: q, mode: 'insensitive' } },
          { id: { contains: q, mode: 'insensitive' } },
          { lokasiGedung: { contains: q, mode: 'insensitive' } },
          { lokasiLantai: { contains: q, mode: 'insensitive' } },
          { lokasiZona: { contains: q, mode: 'insensitive' } },
          { tipe: { contains: q, mode: 'insensitive' } },
          { model: { contains: q, mode: 'insensitive' } },
        ]
      } : {})
    },
    select: {
      id: true,
      nama: true,
      kategori: true,
      tipe: true,
      model: true,
      lokasiGedung: true,
      lokasiLantai: true,
      lokasiZona: true,
    }
  });

  // Hitung skor mirip seperti sebelumnya
  const scoredAssets = assets.map(a => {
    let score = 0;
    const tAset = (staging.predTipeAset || "").toLowerCase();
    const aTipe = (a.tipe || "").toLowerCase();
    const aKat = (a.kategori || "").toLowerCase();
    
    if (aTipe.includes(tAset) || tAset.includes(aTipe)) score += 50;
    else if (aKat.includes(tAset) || tAset.includes(aKat)) score += 20;

    if (a.lokasiGedung.toLowerCase() === (staging.predLokasiGedung || "").toLowerCase()) score += 30;
    
    const tLantai = (staging.predLokasiLantai || "").toLowerCase();
    const aLantai = (a.lokasiLantai || "").toLowerCase();
    if (tLantai === aLantai || tLantai.includes(aLantai) || aLantai.includes(tLantai)) score += 15;

    const tZona = (staging.predLokasiZona || "").toLowerCase();
    const aZona = (a.lokasiZona || "").toLowerCase();
    if (tZona === aZona || tZona.includes(aZona) || aZona.includes(tZona)) score += 10;

    return { ...a, score };
  }).sort((a, b) => b.score - a.score);

  return scoredAssets.slice(0, 15);
}

export async function recalculateAssetRUL(assetId: string) {
  try {
    const asset = await prisma.masterAsset.findUnique({
      where: { id: assetId },
      include: {
        complaints: {
          orderBy: { tanggalPengerjaan: "asc" }
        }
      }
    });

    if (!asset) {
      console.warn(`[recalculateAssetRUL] Asset with ID ${assetId} not found.`);
      return;
    }

    if (asset.status !== "Aktif") {
      console.log(`[recalculateAssetRUL] Asset status is ${asset.status}, skipping RUL recalculation.`);
      return;
    }

    const complaints = asset.complaints || [];
    const totalKomplain = complaints.length;

    const sevMap: Record<string, number> = {
      'Ringan': 1, 'Sedang': 2, 'Berat': 3, 'Fatal': 4,
      'Rendah': 1, 'Tinggi': 3, 'Kritis': 4,
      'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4
    };

    const biayaTotal = complaints.reduce((sum: number, c: any) => sum + c.biayaPerbaikan, 0);
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
    const severities = complaints.map((c: any) => sevMap[c.severity] || 1);
    const severityMean = severities.length > 0 ? severities.reduce((sum: number, s: number) => sum + s, 0) / severities.length : 1.0;
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

    console.log(`[recalculateAssetRUL] Requesting RUL prediction for asset ${assetId}...`);
    const pyRes = await fetch(`${AI_URL}/api/predict/rul`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asset_id: asset.id,
        features,
      }),
    });

    if (!pyRes.ok) {
      throw new Error(`FastAPI prediction failed with status ${pyRes.status}: ${pyRes.statusText}`);
    }

    const result = await pyRes.json();
    const newRUL = Math.round(result.predicted_rul_days);
    const newEstimasi = new Date();
    newEstimasi.setDate(newEstimasi.getDate() + newRUL);

    let health = "Healthy";
    if (newRUL <= 30) health = "Critical";
    else if (newRUL <= 90) health = "Warning";
    else if (newRUL <= 180) health = "Watch";

    await prisma.masterAsset.update({
      where: { id: assetId },
      data: {
        sisaUmurHari: newRUL,
        estimasiPenggantian: newEstimasi,
        healthStatus: health,
      },
    });

    console.log(`[recalculateAssetRUL] Asset ${assetId} updated successfully: RUL = ${newRUL} days, Health = ${health}`);
  } catch (error) {
    console.error(`[recalculateAssetRUL] Error recalculating RUL for asset ${assetId}:`, error);
  }
}
