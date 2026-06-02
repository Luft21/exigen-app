import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'; // Prevent caching for cron jobs

export async function GET() {
  try {
    // 1. Ambil semua aset yang statusnya aktif
    const activeAssets = await prisma.masterAsset.findMany({
      where: { status: "Aktif" },
    });

    if (activeAssets.length === 0) {
      return NextResponse.json({ message: "Tidak ada aset aktif untuk diprediksi" });
    }

    // 1.5. Ambil summary histori kerusakan untuk menghitung total komplain dan biaya perbaikan
    const complaintsSummary = await prisma.assetComplaint.groupBy({
      by: ['idAset'],
      _count: {
        id: true,
      },
      _sum: {
        biayaPerbaikan: true,
      },
      where: {
        idAset: { not: null }
      }
    });

    const summaryMap = new Map();
    for (const summary of complaintsSummary) {
      if (summary.idAset) {
        summaryMap.set(summary.idAset, {
          jumlah_kerusakan: summary._count.id,
          biaya_perbaikan_kumulatif: summary._sum.biayaPerbaikan || 0,
        });
      }
    }

    // 2. Siapkan batch data untuk dikirim ke Python ML
    let updatedCount = 0;
    
    // Asumsi kita hit API satu per satu untuk simulasi (Idealnya kirim batch array ke Python API)
    for (const asset of activeAssets) {
      const assetSummary = summaryMap.get(asset.id) || { jumlah_kerusakan: 0, biaya_perbaikan_kumulatif: 0 };
      const umurHariNow = Math.floor((Date.now() - new Date(asset.tanggalInstalasi).getTime()) / 86_400_000);
      
      // Kumpulkan features berdasarkan data historis aktual
      const features = {
        kategori: asset.kategori,
        subKategori: asset.subKategori,
        tipe: asset.tipe,
        merek: asset.merek,
        tingkatKekritisan: asset.tingkatKekritisan,
        jumlah_kerusakan: assetSummary.jumlah_kerusakan,
        biaya_perbaikan_kumulatif: assetSummary.biaya_perbaikan_kumulatif,
        umur: umurHariNow,
      };

      try {
        const pyRes = await fetch("http://127.0.0.1:8000/predict/rul", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            asset_id: asset.id,
            features,
          }),
        });

        if (pyRes.ok) {
          const result = await pyRes.json();
          const newRUL = result.predicted_rul_days;
          
          // Hitung estimasi tanggal penggantian baru
          const newEstimasi = new Date();
          newEstimasi.setDate(newEstimasi.getDate() + newRUL);

          await prisma.masterAsset.update({
            where: { id: asset.id },
            data: {
              sisaUmurHari: newRUL,
              estimasiPenggantian: newEstimasi,
            },
          });
          updatedCount++;
        }
      } catch (error) {
        console.error(`Gagal memprediksi RUL untuk aset ${asset.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengupdate RUL untuk ${updatedCount} aset aktif.`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
