import { StatusTiket } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/severity-badge";
import { Wrench, Replace } from "lucide-react";
import { mulaiServis, ajukanPenggantian } from "@/app/actions/ticket";
import prisma from "@/lib/prisma";

export default async function TeknisiDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "TEKNISI") {
    redirect("/login");
  }

  // Ambil tiket yang menunggu teknisi
  const tiketBaru = await prisma.assetComplaint.findMany({
    where: { statusTiket: StatusTiket.MENUNGGU_TEKNISI },
    orderBy: { tanggalPerencanaan: "desc" },
  });

  const tiketIds = tiketBaru.map((t) => t.id);
  const linkedStaging = await prisma.komplainPerbaikan.findMany({
    where: { id: { in: tiketIds } },
    select: { id: true, teksKeluhan: true },
  });
  const stagingMap = new Map(linkedStaging.map((s) => [s.id, s.teksKeluhan]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Dashboard Teknisi</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Daftar tiket keluhan (NLP Auto-Ticketing) yang membutuhkan investigasi Anda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiketBaru.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground bg-white dark:bg-zinc-800 rounded-lg border">
            Tidak ada tiket keluhan baru hari ini.
          </div>
        ) : (
          tiketBaru.map((tiket) => (
            <Card key={tiket.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <SeverityBadge severity={tiket.severity} />
                  <span className="text-xs text-muted-foreground">
                    {tiket.tanggalPerencanaan.toLocaleDateString("id-ID")}
                  </span>
                </div>
                <CardTitle className="text-base mt-2">{tiket.tipe || "Aset"}</CardTitle>
                <p className="text-xs text-muted-foreground">{tiket.namaAset} (ID: {tiket.idAset})</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="bg-muted/50 p-3 rounded-md text-sm mb-4 flex-1">
                  <span className="font-semibold block mb-1">Keluhan (Laporan Awal):</span>
                  {stagingMap.get(tiket.id) || "-"}
                </div>

                <div className="flex gap-2 mt-auto">
                  {/* Form untuk action Servis */}
                  <form action={mulaiServis.bind(null, tiket.id)} className="flex-1">
                    <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 text-sm font-medium transition-colors">
                      <Wrench className="h-4 w-4" />
                      Servis
                    </button>
                  </form>
                  
                  {/* Form untuk action Ganti Barang */}
                  <form action={ajukanPenggantian} className="flex-1">
                    <input type="hidden" name="idTiket" value={tiket.id} />
                    <input type="hidden" name="alasan" value="Pengajuan dari Dashboard Teknisi" />
                    <button className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md py-2 text-sm font-medium transition-colors">
                      <Replace className="h-4 w-4" />
                      Ganti
                    </button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
