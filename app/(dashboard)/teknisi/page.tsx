import { PrismaClient, StatusTiket } from "@prisma/client";
import { StatusTiket } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
                  <Badge variant={tiket.severity === "Fatal" || tiket.severity === "Kritis" ? "destructive" : "default"}>
                    {tiket.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {tiket.tanggalPerencanaan.toLocaleDateString("id-ID")}
                  </span>
                </div>
                <CardTitle className="text-base mt-2">{tiket.namaAset}</CardTitle>
                <p className="text-xs text-muted-foreground">ID Aset: {tiket.idAset}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="bg-muted/50 p-3 rounded-md text-sm mb-4 flex-1">
                  <span className="font-semibold block mb-1">Keluhan:</span>
                  {tiket.jenisKerusakan}
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
                  <form action={ajukanPenggantian.bind(null, tiket.id)} className="flex-1">
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
