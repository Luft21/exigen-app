"use server";

import { StatusTiket, TindakanTeknisi, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// 1. Integrasi NLP: Membuat tiket baru dengan status MENUNGGU_TEKNISI
export async function buatTiketOtomatis(formData: FormData) {
  const keluhan = formData.get("keluhan") as string;
  const idAset = formData.get("idAset") as string;
  
  const aset = await prisma.masterAsset.findUnique({ where: { id: idAset } });
  if (!aset) throw new Error("Aset tidak ditemukan");

  // Panggil FastAPI Microservice
  let kategori = aset.kategori;
  let severity = "Sedang";
  let saranSistem = "Belum ada saran dari AI";
  const rawId = `CMP-NLP-${Math.random().toString(36).substring(7)}`;

  try {
    const aiResponse = await fetch("http://127.0.0.1:8000/predict/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_laporan: rawId,
        teks_keluhan: keluhan,
      }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const prediksi = aiData.hasil_prediksi_ai;
      
      kategori = prediksi.kategori_departemen || kategori;
      severity = prediksi.tingkat_severity || severity;
      saranSistem = aiData.saran_tindakan_sistem || saranSistem;
    } else {
      console.error("FastAPI error:", await aiResponse.text());
    }
  } catch (e) {
    console.error("FastAPI tidak dapat dihubungi. Pastikan server python berjalan.", e);
  }

  await prisma.assetComplaint.create({
    data: {
      id: rawId,
      idAset,
      namaAset: aset.nama,
      kategori: kategori,
      subKategori: aset.subKategori,
      tipe: aset.tipe,
      tanggalPerencanaan: new Date(),
      tanggalPengerjaan: new Date(),
      jenisKerusakan: keluhan.substring(0, 50),
      severity: severity,
      penyebab: `AI: ${saranSistem}`,
      biayaPerbaikan: 0,
      sparePartDigunakan: "-",
      statusTiket: StatusTiket.MENUNGGU_TEKNISI,
    },
  });

  revalidatePath("/teknisi");
}

// 1b. Guest: Membuat komplain tanpa login & tanpa ID Aset
export async function buatKomplainGuest(
  _prevState: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const keluhan = (formData.get("keluhan") as string)?.trim();

  if (!keluhan || keluhan.length < 20) {
    return { success: false, error: "Deskripsi terlalu singkat. Jelaskan nama barang, gedung, dan lantai." };
  }

  let kategori = "Umum";
  let severity = "Sedang";
  let saranSistem = "Ditangani teknisi";
  const rawId = `CMP-GUEST-${Math.random().toString(36).substring(7)}`;

  try {
    const aiResponse = await fetch("http://127.0.0.1:8000/predict/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_laporan: rawId, teks_keluhan: keluhan }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const prediksi = aiData.hasil_prediksi_ai;
      kategori = prediksi.kategori_departemen || kategori;
      severity = prediksi.tingkat_severity || severity;
      saranSistem = aiData.saran_tindakan_sistem || saranSistem;
    }
  } catch {
    // FastAPI opsional — lanjut tanpa prediksi AI
  }

  try {
    await prisma.assetComplaint.create({
      data: {
        id: rawId,
        idAset: null,
        namaAset: keluhan.substring(0, 50).trimEnd(),
        kategori,
        subKategori: "-",
        tipe: "-",
        tanggalPerencanaan: new Date(),
        tanggalPengerjaan: new Date(),
        jenisKerusakan: keluhan.substring(0, 50),
        severity,
        penyebab: `AI: ${saranSistem}`,
        biayaPerbaikan: 0,
        sparePartDigunakan: "-",
        statusTiket: StatusTiket.MENUNGGU_TEKNISI,
      },
    });
  } catch {
    return { success: false, error: "Gagal menyimpan laporan. Silakan coba lagi." };
  }

  revalidatePath("/teknisi");
  return { success: true };
}

// 1.5. Teknisi/Admin: Assign tiket staging NLP ke Aset riil
export async function assignStagingKeAset(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const idStaging = formData.get("idStaging") as string;
  const idAset = formData.get("idAset") as string;
  const idTeknisi = formData.get("idTeknisi") as string;

  if (!idStaging || !idAset || !idTeknisi) throw new Error("Data tidak lengkap");

  const staging = await prisma.komplainPerbaikan.findUnique({ where: { id: idStaging } });
  if (!staging) throw new Error("Tiket Staging tidak ditemukan");

  const aset = await prisma.masterAsset.findUnique({ where: { id: idAset } });
  if (!aset) throw new Error("Aset tidak ditemukan");

  // Pindahkan data ke AssetComplaint
  await prisma.assetComplaint.create({
    data: {
      id: `TKT-${Date.now()}`,
      idAset: aset.id,
      namaAset: aset.nama,
      kategori: aset.kategori,
      subKategori: aset.subKategori,
      tipe: aset.tipe,
      tanggalPerencanaan: new Date(),
      // tanggalPengerjaan akan diisi teknisi nanti
      jenisKerusakan: staging.teksKeluhan || staging.predTipeAset,
      severity: staging.predSeverityAwal || "Sedang",
      penyebab: "-",
      biayaPerbaikan: 0,
      sparePartDigunakan: "-",
      statusTiket: StatusTiket.MENUNGGU_TEKNISI,
      idTeknisi: idTeknisi,
    },
  });

  // Tandai staging sudah di-assign
  await prisma.komplainPerbaikan.update({
    where: { id: idStaging },
    data: { statusStaging: "ASSIGNED" },
  });

  revalidatePath("/tiket");
}

// 2. Teknisi: Mengajukan Ganti (Menunggu Persetujuan Manajemen)
export async function ajukanPenggantian(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.TEKNISI) throw new Error("Unauthorized");

  const idTiket = formData.get("idTiket") as string;
  const alasan = formData.get("alasan") as string;

  await prisma.assetComplaint.update({
    where: { id: idTiket },
    data: {
      statusTiket: StatusTiket.MENUNGGU_APPROVAL_GANTI,
      tindakanTeknisi: TindakanTeknisi.GANTI,
      penyebab: alasan,
    },
  });

  revalidatePath("/teknisi");
  revalidatePath("/tiket");
  revalidatePath("/manajemen");
}

// 3. Teknisi: Memilih untuk "Servis" (Melanjutkan ke form input-servis)
export async function mulaiServis(idTiket: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.TEKNISI) throw new Error("Unauthorized");

  await prisma.assetComplaint.update({
    where: { id: idTiket },
    data: {
      tindakanTeknisi: TindakanTeknisi.SERVIS,
      statusTiket: StatusTiket.PROSES_SERVIS,
      idTeknisi: session.user.id,
      tanggalPengerjaan: new Date(),
    },
  });

  revalidatePath("/teknisi");
  revalidatePath("/tiket");
}

// 4. Manajemen: Approve Penggantian
export async function approvePenggantian(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.MANAJEMEN) throw new Error("Unauthorized");

  const idTiket = formData.get("idTiket") as string;
  const idAsetBaru = formData.get("idAsetBaru") as string;
  const merekBaru = formData.get("merek") as string;
  const modelBaru = formData.get("model") as string;
  const biaya = Number(formData.get("biaya"));

  const tiket = await prisma.assetComplaint.findUnique({ 
    where: { id: idTiket },
    include: { asset: true }
  });
  if (!tiket || !tiket.asset) throw new Error("Tiket atau Aset tidak ditemukan");

  const oldAsset = tiket.asset;

  // Transaction untuk memastikan keamanan data
  await prisma.$transaction(async (tx) => {
    // a. Pensiunkan aset lama
    await tx.masterAsset.update({
      where: { id: oldAsset.id },
      data: { status: "Diganti" },
    });

    // b. Buat aset baru (mewarisi properti lokasi, tipe, kategori)
    await tx.masterAsset.create({
      data: {
        id: idAsetBaru,
        nama: oldAsset.nama,
        merek: merekBaru,
        model: modelBaru,
        kategori: oldAsset.kategori,
        subKategori: oldAsset.subKategori,
        tipe: oldAsset.tipe,
        tanggalInstalasi: new Date(),
        lokasiGedung: oldAsset.lokasiGedung,
        lokasiLantai: oldAsset.lokasiLantai,
        lokasiZona: oldAsset.lokasiZona,
        tingkatKekritisan: oldAsset.tingkatKekritisan,
        status: "Aktif",
        sisaUmurHari: oldAsset.sisaUmurHari, // Atau bisa di-reset sesuai standar
        estimasiPenggantian: oldAsset.estimasiPenggantian, // Atau hitung ulang
        healthStatus: "Good",
      }
    });

    // c. Update status tiket
    await tx.assetComplaint.update({
      where: { id: idTiket },
      data: {
        statusTiket: StatusTiket.SELESAI,
        idManajemenApproval: session.user.id,
        tanggalSelesai: new Date(),
        biayaPerbaikan: biaya,
      },
    });

    // d. Tambahkan ke ReplacementHistory
    await tx.replacementHistory.create({
      data: {
        idAsetLama: oldAsset.id,
        namaAsetLama: oldAsset.nama,
        kategori: oldAsset.kategori,
        tipe: oldAsset.tipe,
        idAsetBaru: idAsetBaru,
        tanggalPenggantian: new Date(),
        alasanPenggantian: tiket.penyebab || "Fatal / Rusak",
        biayaPenggantian: biaya,
      },
    });
  });

  revalidatePath("/manajemen");
  revalidatePath("/penggantian");
  revalidatePath("/aset");
}

// 5. Manajemen: Reject Penggantian (Kembali ke Teknisi untuk Servis)
export async function rejectPenggantian(idTiket: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.MANAJEMEN) throw new Error("Unauthorized");

  await prisma.assetComplaint.update({
    where: { id: idTiket },
    data: {
      statusTiket: StatusTiket.MENUNGGU_TEKNISI,
      tindakanTeknisi: null,
      isGantiDitolak: true,
      idManajemenApproval: session.user.id,
    },
  });

  revalidatePath("/manajemen");
  revalidatePath("/teknisi");
  revalidatePath("/tiket");
}

// 6. Teknisi: Menyelesaikan Servis
export async function selesaikanServis(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.TEKNISI) throw new Error("Unauthorized");

  const idTiket = formData.get("idTiket") as string;
  const jenisKerusakan = formData.get("jenisKerusakan") as string;
  const penyebab = formData.get("penyebab") as string;
  const biayaPerbaikan = Number(formData.get("biayaPerbaikan"));
  const sparePartDigunakan = formData.get("sparePartDigunakan") as string;
  const severity = formData.get("severity") as string; // Severity riil

  await prisma.assetComplaint.update({
    where: { id: idTiket },
    data: {
      tanggalSelesai: new Date(),
      jenisKerusakan,
      penyebab,
      biayaPerbaikan,
      sparePartDigunakan,
      severity,
      statusTiket: StatusTiket.SELESAI,
    },
  });

  revalidatePath("/teknisi");
  revalidatePath("/tiket");
  revalidatePath("/maintenance");
}
