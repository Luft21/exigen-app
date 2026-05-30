"use server";

import { StatusTiket, TindakanTeknisi } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

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

  revalidatePath("/aset");
  revalidatePath("/maintenance");
  revalidatePath("/tiket");
  redirect("/maintenance");
}
