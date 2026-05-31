import { StatusTiket } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { approvePenggantian, rejectPenggantian } from "@/app/actions/ticket";
import prisma from "@/lib/prisma";

export default async function ManajemenDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "MANAJEMEN") {
    redirect("/login");
  }

  // Ambil tiket yang diajukan untuk ganti barang
  const pengajuanGanti = await prisma.assetComplaint.findMany({
    where: { statusTiket: StatusTiket.MENUNGGU_APPROVAL_GANTI },
    orderBy: { tanggalPerencanaan: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Dashboard Manajemen</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Persetujuan (Approval) penggantian aset yang diajukan oleh Teknisi.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pengajuanGanti.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground bg-white dark:bg-zinc-800 rounded-lg border">
            Tidak ada pengajuan penggantian aset saat ini.
          </div>
        ) : (
          pengajuanGanti.map((tiket) => (
            <Card key={tiket.id} className="flex flex-col border-amber-200 dark:border-amber-900/50">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge className="bg-amber-500 hover:bg-amber-600">Menunggu Approval</Badge>
                  <span className="text-xs text-muted-foreground">
                    {tiket.tanggalPerencanaan.toLocaleDateString("id-ID")}
                  </span>
                </div>
                <CardTitle className="text-base mt-2">{tiket.tipe || "Aset"}</CardTitle>
                <p className="text-xs text-muted-foreground">{tiket.namaAset} (ID: {tiket.idAset})</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                <div className="bg-muted/50 p-3 rounded-md text-sm flex-1">
                  <span className="font-semibold block mb-1">Laporan Kerusakan:</span>
                  {tiket.jenisKerusakan}
                </div>

                {/* Form untuk Approve (Membutuhkan input alasan, biaya, dan ID baru) */}
                <form action={approvePenggantian} className="space-y-3 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-100 dark:border-blue-800/30">
                  <input type="hidden" name="idTiket" value={tiket.id} />
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">ID Aset Baru</label>
                    <input name="idAsetBaru" required placeholder="Contoh: AST-NEW-001" className="w-full text-sm p-2 rounded-md border bg-background" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Alasan Ganti</label>
                    <input name="alasan" required placeholder="Contoh: Sparepart sudah diskontinyu" className="w-full text-sm p-2 rounded-md border bg-background" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Estimasi Biaya (Rp)</label>
                    <input type="number" name="biaya" required placeholder="Contoh: 15000000" className="w-full text-sm p-2 rounded-md border bg-background" />
                  </div>

                  <button type="submit" className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-md py-2 text-sm font-medium transition-colors mt-2">
                    <Check className="h-4 w-4" />
                    Setujui (Approve)
                  </button>
                </form>

                {/* Form untuk Reject */}
                <form action={rejectPenggantian.bind(null, tiket.id)}>
                  <button type="submit" className="w-full flex items-center justify-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md py-2 text-sm font-medium transition-colors">
                    <X className="h-4 w-4" />
                    Tolak (Kembalikan ke Servis)
                  </button>
                </form>

              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
