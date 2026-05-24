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

// 2. Teknisi: Memilih untuk "Ganti Barang"
export async function ajukanPenggantian(idTiket: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.TEKNISI) throw new Error("Unauthorized");

  await prisma.assetComplaint.update({
    where: { id: idTiket },
    data: {
      tindakanTeknisi: TindakanTeknisi.GANTI,
      statusTiket: StatusTiket.MENUNGGU_APPROVAL_GANTI,
      idTeknisi: session.user.id,
    },
  });

  revalidatePath("/teknisi");
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
    },
  });

  revalidatePath("/teknisi");
}

// 4. Manajemen: Approve Penggantian
export async function approvePenggantian(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.MANAJEMEN) throw new Error("Unauthorized");

  const idTiket = formData.get("idTiket") as string;
  const idAsetBaru = formData.get("idAsetBaru") as string;
  const alasan = formData.get("alasan") as string;
  const biaya = Number(formData.get("biaya"));

  const tiket = await prisma.assetComplaint.findUnique({ where: { id: idTiket } });
  if (!tiket) throw new Error("Tiket tidak ditemukan");

  // a. Update status tiket
  await prisma.assetComplaint.update({
    where: { id: idTiket },
    data: {
      statusTiket: StatusTiket.SELESAI,
      idManajemenApproval: session.user.id,
      tanggalSelesai: new Date(),
    },
  });

  // b. Tambahkan ke ReplacementHistory
  await prisma.replacementHistory.create({
    data: {
      idAsetLama: tiket.idAset,
      namaAsetLama: tiket.namaAset,
      kategori: tiket.kategori,
      tipe: tiket.tipe,
      idAsetBaru,
      tanggalPenggantian: new Date(),
      alasanPenggantian: alasan,
      biayaPenggantian: biaya,
    },
  });

  // c. Update status aset lama menjadi "Non-Aktif"
  await prisma.masterAsset.update({
    where: { id: tiket.idAset },
    data: { status: "Non-Aktif" },
  });

  revalidatePath("/manajemen");
  revalidatePath("/penggantian");
}

// 5. Manajemen: Reject Penggantian (Kembali ke Teknisi untuk Servis)
export async function rejectPenggantian(idTiket: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.MANAJEMEN) throw new Error("Unauthorized");

  await prisma.assetComplaint.update({
    where: { id: idTiket },
    data: {
      statusTiket: StatusTiket.PROSES_SERVIS, // Sesuai kesepakatan, kembali diservis
      tindakanTeknisi: TindakanTeknisi.SERVIS,
      idManajemenApproval: session.user.id,
    },
  });

  revalidatePath("/manajemen");
  revalidatePath("/teknisi");
}

// 6. Teknisi: Menyelesaikan Servis
export async function selesaikanServis(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.TEKNISI) throw new Error("Unauthorized");

  const idTiket = formData.get("idTiket") as string;
  const tanggalPengerjaan = formData.get("tanggalPengerjaan") as string;
  const tanggalSelesai = formData.get("tanggalSelesai") as string;
  const jenisKerusakan = formData.get("jenisKerusakan") as string;
  const penyebab = formData.get("penyebab") as string;
  const biayaPerbaikan = Number(formData.get("biayaPerbaikan"));
  const sparePartDigunakan = formData.get("sparePartDigunakan") as string;

  await prisma.assetComplaint.update({
    where: { id: idTiket },
    data: {
      tanggalPengerjaan: new Date(tanggalPengerjaan),
      tanggalSelesai: new Date(tanggalSelesai),
      jenisKerusakan,
      penyebab,
      biayaPerbaikan,
      sparePartDigunakan,
      statusTiket: StatusTiket.SELESAI,
    },
  });

  revalidatePath("/teknisi");
  revalidatePath("/tiket");
  revalidatePath("/maintenance");
}
