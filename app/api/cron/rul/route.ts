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

    // 2. Siapkan batch data untuk dikirim ke Python ML
    let updatedCount = 0;
    
    // Asumsi kita hit API satu per satu untuk simulasi (Idealnya kirim batch array ke Python API)
    for (const asset of activeAssets) {
      // Kumpulkan features (dalam skenario nyata, join dengan data historis)
      const features = {
        kategori: asset.kategori,
        tingkatKekritisan: asset.tingkatKekritisan,
        // Mocking histori kerusakan untuk prediksi
        jumlah_kerusakan: Math.floor(Math.random() * 10),
        biaya_perbaikan_kumulatif: Math.floor(Math.random() * 20000000),
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
