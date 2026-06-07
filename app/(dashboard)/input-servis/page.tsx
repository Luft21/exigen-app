import prisma from "@/lib/prisma";
import InputServisClient from "@/components/input-servis-client";

export const metadata = {
  title: "Input Data Servis",
};

export default async function InputServisPage() {
  const [assets, uniqueKerusakan, uniquePenyebab, uniqueSparepart] = await Promise.all([
    prisma.masterAsset.findMany({
      where: { status: "Aktif" },
      select: {
        id: true,
        nama: true,
        kategori: true,
        subKategori: true,
        tipe: true,
      },
    }),
    prisma.assetComplaint.findMany({
      where: { jenisKerusakan: { not: "-" } },
      select: { jenisKerusakan: true },
      distinct: ['jenisKerusakan']
    }),
    prisma.assetComplaint.findMany({
      where: { penyebab: { not: "-" } },
      select: { penyebab: true },
      distinct: ['penyebab']
    }),
    prisma.assetComplaint.findMany({
      where: { sparePartDigunakan: { not: "-" } },
      select: { sparePartDigunakan: true },
      distinct: ['sparePartDigunakan']
    })
  ]);

  return (
    <InputServisClient
      assets={assets}
      uniqueKerusakan={uniqueKerusakan.map((k: { jenisKerusakan: string }) => k.jenisKerusakan)}
      uniquePenyebab={uniquePenyebab.map((p: { penyebab: string }) => p.penyebab)}
      uniqueSparepart={uniqueSparepart.map((s: { sparePartDigunakan: string }) => s.sparePartDigunakan)}
    />
  );
}
