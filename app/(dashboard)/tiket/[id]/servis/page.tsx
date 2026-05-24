import { PrismaClient, Role } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { selesaikanServis } from "@/app/actions/ticket";
import { Wrench } from "lucide-react";
import prisma from "@/lib/prisma";

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
          <form action={selesaikanServis} className="space-y-6">
            <input type="hidden" name="idTiket" value={tiket.id} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>ID Aset</Label>
                <Input value={tiket.idAset} readOnly className="bg-muted/40" />
              </div>
              <div className="grid gap-2">
                <Label>Nama Aset</Label>
                <Input value={tiket.namaAset} readOnly className="bg-muted/40" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tanggal Pengerjaan</Label>
                <Input 
                  type="date" 
                  name="tanggalPengerjaan" 
                  defaultValue={formatForDateInput(tiket.tanggalPengerjaan)}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label>Tanggal Selesai</Label>
                <Input 
                  type="date" 
                  name="tanggalSelesai" 
                  defaultValue={formatForDateInput(new Date())}
                  required 
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Rincian Kerusakan (Bisa diedit teknisi)</Label>
              <Input 
                name="jenisKerusakan" 
                defaultValue={tiket.jenisKerusakan}
                required 
              />
            </div>

            <div className="grid gap-2">
              <Label>Penyebab (Diagnosa Teknisi)</Label>
              <Textarea 
                name="penyebab" 
                defaultValue={tiket.penyebab.replace("AI: Belum ada saran dari AI", "").trim()}
                placeholder="Tuliskan penyebab kerusakan yang sebenarnya ditemukan..."
                className="min-h-[80px]"
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Biaya Perbaikan (Rp)</Label>
                <Input 
                  type="number" 
                  name="biayaPerbaikan" 
                  defaultValue={tiket.biayaPerbaikan}
                  min="0"
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label>Spare Part Digunakan</Label>
                <Input 
                  name="sparePartDigunakan" 
                  defaultValue={tiket.sparePartDigunakan === "-" ? "" : tiket.sparePartDigunakan}
                  placeholder="Contoh: Baut, Kabel..." 
                />
              </div>
            </div>

            <Button type="submit">Simpan & Selesaikan Tiket</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
