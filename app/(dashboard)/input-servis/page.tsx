import { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import InputServisClient from "@/components/input-servis-client";

export const metadata = {
  title: "Input Data Servis",
};

export default async function InputServisPage() {
  const assets = await prisma.masterAsset.findMany({
    where: { status: "Aktif" },
    select: {
      id: true,
      nama: true,
      kategori: true,
      subKategori: true,
      tipe: true,
    },
  });

  return <InputServisClient assets={assets} />;
}
