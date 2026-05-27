import { PrismaClient, Role, StatusTiket } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Wrench, CheckCircle, XCircle, MessageSquareWarning } from "lucide-react";
import { rejectPenggantian, ajukanPenggantian, mulaiServis } from "@/app/actions/ticket";
import { AssignAssetModal } from "@/components/assign-asset-modal";
import { AjukanGantiModal } from "@/components/ajukan-ganti-modal";
import { ApproveGantiModal } from "@/components/approve-ganti-modal";
import { ActionButtonClient } from "@/components/action-button-client";
import prisma from "@/lib/prisma";

const statusColor: Record<string, string> = {
  MENUNGGU_TEKNISI: "bg-warning/15 text-warning border-warning/30",
  PROSES_SERVIS: "bg-primary/15 text-primary border-primary/30",
  MENUNGGU_APPROVAL_GANTI: "bg-destructive/15 text-destructive border-destructive/30",
  SELESAI: "bg-success/15 text-success border-success/30",
  DITOLAK: "bg-muted text-muted-foreground border-muted-foreground/30",
};

export const metadata = {
  title: "Tiket Komplain",
};

export default async function TiketPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = 50; // Tampilkan 50 riwayat per halaman

  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role;

  const activeTickets = await prisma.assetComplaint.findMany({
    where: {
      statusTiket: {
        notIn: ["SELESAI", "DITOLAK"],
      },
    },
    orderBy: { tanggalPerencanaan: "desc" },
    include: { teknisiPelaksana: true, asset: true },
  });

  const masterAssets = await prisma.masterAsset.findMany({
    where: { status: "Aktif" },
  });

  const teknisiList = await prisma.user.findMany({
    where: { role: "TEKNISI" },
    select: { id: true, nama: true, username: true }
  });

  const [historyTickets, totalHistory, stagingTickets] = await Promise.all([
    prisma.assetComplaint.findMany({
      where: {
        statusTiket: {
          in: ["SELESAI", "DITOLAK"],
        },
      },
      orderBy: { tanggalPerencanaan: "desc" },
      include: { teknisiPelaksana: true, asset: true },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.assetComplaint.count({
      where: {
        statusTiket: {
          in: ["SELESAI", "DITOLAK"],
        },
      },
    }),
    prisma.komplainPerbaikan.findMany({
      where: {
        statusStaging: {
          in: ["OPEN", "DRAFT"],
        },
      },
      orderBy: { tanggalDibuat: "desc" },
    }),
  ]);

  const totalPages = Math.ceil(totalHistory / pageSize);

  const renderStagingTable = (data: any[], teknisiData: any[]) => (
    <div className="rounded-lg border overflow-x-auto bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 border-b">
          <tr>
            <th className="h-10 px-4 text-left font-medium">ID Staging</th>
            <th className="h-10 px-4 text-left font-medium">Keluhan (Teks Asli)</th>
            <th className="h-10 px-4 text-left font-medium">Prediksi NLP (Aset)</th>
            <th className="h-10 px-4 text-left font-medium">Prediksi NLP (Lokasi)</th>
            <th className="h-10 px-4 text-left font-medium">Severity</th>
            <th className="h-10 px-4 text-center font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((t) => (
            <tr key={t.id} className="border-b transition-colors hover:bg-muted/50">
              <td className="p-4 align-middle font-heading text-xs">{t.id}</td>
              <td className="p-4 align-middle text-xs max-w-[200px] truncate" title={t.teksKeluhan}>
                {t.teksKeluhan || "-"}
              </td>
              <td className="p-4 align-middle">
                <div className="text-xs">
                  <span className="font-medium block">{t.predTipeAset}</span>
                  <span className="text-muted-foreground">{t.predKategoriDept}</span>
                </div>
              </td>
              <td className="p-4 align-middle text-xs">
                <div>Gedung: <span className="font-medium">{t.predLokasiGedung}</span></div>
                <div className="text-muted-foreground">{t.predLokasiLantai.replace("Lantai ", "Lt. ")}, {t.predLokasiZona}</div>
              </td>
              <td className="p-4 align-middle">
                <Badge variant="outline" className={`text-[10px] ${t.predSeverityAwal === 'Tinggi' ? 'bg-destructive/15 text-destructive border-destructive/30' : t.predSeverityAwal === 'Sedang' ? 'bg-warning/15 text-warning border-warning/30' : 'bg-primary/15 text-primary border-primary/30'}`}>
                  {t.predSeverityAwal}
                </Badge>
              </td>
              <td className="p-4 align-middle text-center">
                <div className="flex justify-center gap-2">
                  <AssignAssetModal staging={t} assets={masterAssets} teknisiList={teknisiData} />
                </div>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center p-8 text-muted-foreground">
                Tidak ada antrean komplain NLP.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderTable = (data: any[]) => (
    <div className="rounded-lg border overflow-x-auto bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 border-b">
          <tr>
            <th className="h-10 px-4 text-left font-medium">ID Tiket</th>
            <th className="h-10 px-4 text-left font-medium">Aset</th>
            <th className="h-10 px-4 text-left font-medium">Keluhan (Jenis Kerusakan)</th>
            <th className="h-10 px-4 text-left font-medium">Gedung</th>
            <th className="h-10 px-4 text-left font-medium">Lantai</th>
            <th className="h-10 px-4 text-left font-medium">Zona</th>
            <th className="h-10 px-4 text-left font-medium">Status</th>
            <th className="h-10 px-4 text-left font-medium">Teknisi</th>
            <th className="h-10 px-4 text-center font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((t) => (
            <tr key={t.id} className="border-b transition-colors hover:bg-muted/50">
              <td className="p-4 align-middle font-heading text-xs">{t.id}</td>
              <td className="p-4 align-middle">
                <div className="text-xs">
                  <span className="font-heading text-[10px] text-muted-foreground block">{t.idAset}</span>
                  <span className="font-medium">{t.namaAset}</span>
                </div>
              </td>
              <td className="p-4 align-middle text-xs max-w-[200px] truncate" title={t.jenisKerusakan}>{t.jenisKerusakan}</td>
              <td className="p-4 align-middle text-xs font-medium">{t.asset?.lokasiGedung || "-"}</td>
              <td className="p-4 align-middle text-xs text-muted-foreground">{t.asset?.lokasiLantai && t.asset.lokasiLantai !== "-" ? `Lt. ${t.asset.lokasiLantai}` : "-"}</td>
              <td className="p-4 align-middle text-xs">{t.asset?.lokasiZona || "-"}</td>
              <td className="p-4 align-middle">
                <Badge variant="outline" className={`text-[10px] ${statusColor[t.statusTiket]}`}>
                  {t.statusTiket.replace(/_/g, " ")}
                </Badge>
                {t.isGantiDitolak && t.statusTiket === "MENUNGGU_TEKNISI" && (
                  <Badge variant="destructive" className="text-[9px] mt-1 block w-fit">
                    Ganti Ditolak
                  </Badge>
                )}
              </td>
              <td className="p-4 align-middle text-xs">{t.teknisiPelaksana?.nama || "-"}</td>
              <td className="p-4 align-middle text-center">
                <div className="flex justify-center gap-2">

                  {/* AKSI TEKNISI */}
                  {role === "TEKNISI" && (
                    <>
                      {t.statusTiket === "MENUNGGU_TEKNISI" && (
                        <>
                          <ActionButtonClient 
                            action={mulaiServis.bind(null, t.id)} 
                            variant="outline"
                            className="text-primary border-primary/50 hover:bg-primary hover:text-primary-foreground"
                            confirmTitle="Mulai Pekerjaan?"
                            confirmText="Pastikan Anda sudah berada di lokasi aset untuk mulai menservis."
                          >
                            <Wrench className="h-3 w-3 mr-1" /> Mulai Kerja
                          </ActionButtonClient>
                          <AjukanGantiModal tiketId={t.id} namaAset={t.namaAset} isGantiDitolak={t.isGantiDitolak} />
                        </>
                      )}
                      
                      {t.statusTiket === "PROSES_SERVIS" && (
                        <Link href={`/tiket/${t.id}/servis`}>
                          <Button size="sm" variant="default" className="h-8 gap-1">
                            <CheckCircle className="h-3 w-3" /> Input & Selesai
                          </Button>
                        </Link>
                      )}
                    </>
                  )}

                  {/* AKSI MANAJEMEN / ADMIN */}
                  {role === "MANAJEMEN" && (
                    <>
                      {t.statusTiket === "MENUNGGU_APPROVAL_GANTI" && (
                        <>
                          <ApproveGantiModal 
                            tiketId={t.id} 
                            namaAsetLama={t.namaAset} 
                            merekLama={t.asset?.merek || ""} 
                            modelLama={t.asset?.model || ""}
                            assets={masterAssets}
                          />
                          <ActionButtonClient
                            action={rejectPenggantian.bind(null, t.id)}
                            variant="destructive"
                            confirmTitle="Tolak Penggantian?"
                            confirmText="Tiket akan dikembalikan ke teknisi untuk diservis."
                          >
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                          </ActionButtonClient>
                        </>
                      )}
                    </>
                  )}

                  {/* JIKA SUDAH SELESAI */}
                  {(t.statusTiket === "SELESAI" || t.statusTiket === "DITOLAK") && (
                    <span className="text-xs text-muted-foreground italic">
                      {t.statusTiket === "SELESAI" ? "Tuntas" : "Ditolak"}
                    </span>
                  )}

                </div>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center p-8 text-muted-foreground">
                Tidak ada data tiket.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight">Daftar Tiket Komplain</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola laporan kerusakan aset. Role Anda: <strong>{role}</strong>
          </p>
        </div>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="font-heading text-sm">Kelola Tiket</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="staging" className="w-full">
            <TabsList className="mb-6 grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="staging" className="font-medium gap-2">
                <MessageSquareWarning className="h-4 w-4" /> Staging NLP ({stagingTickets.length})
              </TabsTrigger>
              <TabsTrigger value="aktif" className="font-medium">Tiket Aktif ({activeTickets.length})</TabsTrigger>
              <TabsTrigger value="riwayat" className="font-medium">Riwayat Selesai ({totalHistory})</TabsTrigger>
            </TabsList>
            <TabsContent value="staging" className="m-0 animate-fade-in-up">
              {renderStagingTable(stagingTickets, teknisiList)}
            </TabsContent>
            <TabsContent value="aktif" className="m-0 animate-fade-in-up">
              {renderTable(activeTickets)}
            </TabsContent>
            <TabsContent value="riwayat" className="m-0 animate-fade-in-up">
              {renderTable(historyTickets)}
              
              {/* Pagination untuk Riwayat */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Halaman {page} dari {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <a 
                      href={page > 1 ? `?page=${page - 1}` : "#"}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 ${page <= 1 ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      Prev
                    </a>
                    <a 
                      href={page < totalPages ? `?page=${page + 1}` : "#"}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 ${page >= totalPages ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      Next
                    </a>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
