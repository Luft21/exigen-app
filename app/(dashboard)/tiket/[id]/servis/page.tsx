import { PrismaClient, Role } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import prisma from "@/lib/prisma";
import { FormServisClient } from "@/components/form-servis-client";

export const metadata = {
  title: "Input Servis Teknisi",
};

export default async function FormServisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.TEKNISI) {
    redirect("/"); // Hanya teknisi
  }

  const tiket = await prisma.assetComplaint.findUnique({
    where: { id },
  });

  if (!tiket) {
    return <div>Tiket tidak ditemukan.</div>;
  }

  // Fetch unique data untuk rekomendasi (combobox)
  const uniqueKerusakan = await prisma.assetComplaint.findMany({
    where: { jenisKerusakan: { not: "-" } },
    select: { jenisKerusakan: true },
    distinct: ['jenisKerusakan']
  });

  const uniquePenyebab = await prisma.assetComplaint.findMany({
    where: { penyebab: { not: "-" } },
    select: { penyebab: true },
    distinct: ['penyebab']
  });

  const uniqueSparepart = await prisma.assetComplaint.findMany({
    where: { sparePartDigunakan: { not: "-" } },
    select: { sparePartDigunakan: true },
    distinct: ['sparePartDigunakan']
  });

  // Helper konversi datetime ke format YYYY-MM-DD
  const formatForDateInput = (d: Date | null) => {
    if (!d) return new Date().toISOString().split("T")[0];
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Form Servis Teknisi</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selesaikan servis untuk tiket <strong>{tiket.id}</strong>.
        </p>
      </div>

      <Card className="animate-fade-in-up overflow-hidden">
        <CardHeader>
          <CardTitle className="font-heading text-sm flex items-center gap-2">
            <Wrench className="h-4 w-4" /> Data Pekerjaan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormServisClient 
            tiket={tiket} 
            uniqueKerusakan={uniqueKerusakan.map(k => k.jenisKerusakan)} 
            uniquePenyebab={uniquePenyebab.map(p => p.penyebab)} 
            uniqueSparepart={uniqueSparepart.map(s => s.sparePartDigunakan)} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
