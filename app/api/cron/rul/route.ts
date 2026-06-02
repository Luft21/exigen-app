import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'; // Prevent caching for cron jobs

export async function GET() {
  try {
    const startTime = Date.now();
    console.log("[RUL Cron] Fetching active assets with complaints...");
    
    // 1. Ambil semua aset yang statusnya aktif beserta komplain historisnya dalam satu query
    const activeAssets = await prisma.masterAsset.findMany({
      where: { status: "Aktif" },
      include: {
        complaints: {
          orderBy: { tanggalPengerjaan: "asc" }
        }
      }
    });

    if (activeAssets.length === 0) {
      return NextResponse.json({ message: "Tidak ada aset aktif untuk diprediksi" });
    }

    console.log(`[RUL Cron] Fetched ${activeAssets.length} assets. Compiling features...`);

    const sevMap: Record<string, number> = {
      'Ringan': 1, 'Sedang': 2, 'Berat': 3, 'Fatal': 4,
      'Rendah': 1, 'Tinggi': 3, 'Kritis': 4,
      'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4
    };

    // 2. Compile features in-memory (no database queries inside loop)
    const batchItems = activeAssets.map(asset => {
      const complaints = asset.complaints || [];
      const totalKomplain = complaints.length;
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

      return {
        asset_id: asset.id,
        features: {
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
        }
      };
    });

    console.log(`[RUL Cron] Compiled features for all assets. Sending to Python ML server in batches...`);

    // 3. Hit API Python RUL secara batch
    const pRequestBatchSize = 5000;
    const updateTasks: { id: string; sisaUmurHari: number; estimasiPenggantian: Date }[] = [];

    for (let i = 0; i < batchItems.length; i += pRequestBatchSize) {
      const chunk = batchItems.slice(i, i + pRequestBatchSize);
      console.log(`[RUL Cron] Sending ML batch ${Math.floor(i / pRequestBatchSize) + 1}/${Math.ceil(batchItems.length / pRequestBatchSize)} (${chunk.length} items)...`);
      
      try {
        const pyRes = await fetch("http://127.0.0.1:8000/api/predict/rul/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batch: chunk }),
        });

        if (!pyRes.ok) {
          throw new Error(`Python RUL Batch API returned status ${pyRes.status}`);
        }

        const result = await pyRes.json();
        const results = result.results || [];

        for (const item of results) {
          const newRUL = Math.round(item.predicted_rul_days);
          const newEstimasi = new Date();
          newEstimasi.setDate(newEstimasi.getDate() + newRUL);

          updateTasks.push({
            id: item.asset_id,
            sisaUmurHari: newRUL,
            estimasiPenggantian: newEstimasi,
          });
        }
      } catch (error) {
        console.error(`[RUL Cron] Gagal melakukan prediksi ML batch pada offset ${i}:`, error);
        // Fallback: jika batch gagal total, kita coba single prediction per item di chunk ini agar data tetap terupdate
        console.log(`[RUL Cron] Fallback ke single prediction untuk chunk offset ${i}...`);
        for (const item of chunk) {
          try {
            const singleRes = await fetch("http://127.0.0.1:8000/api/predict/rul", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item),
            });
            if (singleRes.ok) {
              const resJson = await singleRes.json();
              const newRUL = Math.round(resJson.predicted_rul_days);
              const newEstimasi = new Date();
              newEstimasi.setDate(newEstimasi.getDate() + newRUL);
              updateTasks.push({
                id: item.asset_id,
                sisaUmurHari: newRUL,
                estimasiPenggantian: newEstimasi,
              });
            }
          } catch (singleErr) {
            console.error(`[RUL Cron] Fallback single prediction gagal untuk ${item.asset_id}:`, singleErr);
          }
        }
      }
    }

    console.log(`[RUL Cron] ML predictions complete. Updating database in batches...`);

    // 4. Update database secara batch menggunakan PostgreSQL raw query (cepat dan efisien)
    const dbBatchSize = 2000;
    let updatedCount = 0;

    for (let i = 0; i < updateTasks.length; i += dbBatchSize) {
      const chunk = updateTasks.slice(i, i + dbBatchSize);
      
      try {
        const valueRows = chunk.map(item => {
          const sanitizedId = item.id.replace(/[^a-zA-Z0-9-_]/g, '');
          const sisaUmur = Number(item.sisaUmurHari);
          const dateStr = item.estimasiPenggantian.toISOString();
          return `('${sanitizedId}', ${sisaUmur}, '${dateStr}'::timestamp)`;
        }).join(",\n");

        const query = `
          UPDATE "MasterAsset" AS m SET
            "sisaUmurHari" = v.sisa_umur,
            "estimasiPenggantian" = v.estimasi_penggantian
          FROM (VALUES
            ${valueRows}
          ) AS v(id, sisa_umur, estimasi_penggantian)
          WHERE m.id = v.id
        `;

        await prisma.$executeRawUnsafe(query);
        updatedCount += chunk.length;
        console.log(`[RUL Cron] DB updated ${updatedCount}/${updateTasks.length} assets...`);
      } catch (dbError) {
        console.error(`[RUL Cron] Gagal melakukan batch update DB pada offset ${i}, fallback ke sequential update:`, dbError);
        // Fallback: update individual jika query raw bermasalah
        for (const item of chunk) {
          try {
            await prisma.masterAsset.update({
              where: { id: item.id },
              data: {
                sisaUmurHari: item.sisaUmurHari,
                estimasiPenggantian: item.estimasiPenggantian,
              },
            });
            updatedCount++;
          } catch (singleDbError) {
            console.error(`[RUL Cron] Gagal update individual untuk ${item.id}:`, singleDbError);
          }
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[RUL Cron] Done. Updated ${updatedCount} assets in ${duration}s.`);

    return NextResponse.json({
      success: true,
      message: `Berhasil mengupdate RUL untuk ${updatedCount} aset aktif dalam ${duration} detik.`,
    });
  } catch (e: any) {
    console.error("[RUL Cron] Fatal error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
