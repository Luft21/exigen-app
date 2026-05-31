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
import { TiketFilter } from "@/components/tiket-filter";
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
  searchParams: Promise<{ 
    page?: string;
    tab?: string;
    q?: string;
    gedung?: string;
    lantai?: string;
    zona?: string;
    status?: string;
    teknisi?: string;
    kerusakan?: string;
  }>;
}) {
  const { 
    page: pageParam, 
    tab, 
    q, 
    gedung, 
    lantai, 
    zona, 
    status, 
    teknisi, 
    kerusakan 
  } = await searchParams;
  
  const page = parseInt(pageParam || "1", 10);
  const pageSize = 50;

  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role;

  // 1. Build Filter untuk AssetComplaint (Aktif & Riwayat)
  const filterAssetComplaint: any = {
    ...(q ? { OR: [{ namaAset: { contains: q } }, { idAset: { contains: q } }, { id: { contains: q } }] } : {}),
    ...(kerusakan ? { jenisKerusakan: kerusakan } : {}),
    ...(teknisi ? { idTeknisi: teknisi } : {}),
  };
  if (gedung || lantai || zona) {
    filterAssetComplaint.asset = {
      ...(gedung ? { lokasiGedung: gedung } : {}),
      ...(lantai ? { lokasiLantai: lantai } : {}),
      ...(zona ? { lokasiZona: zona } : {}),
    };
  }

  // 2. Build Filter untuk KomplainPerbaikan (Staging)
  const filterStaging: any = {
    statusStaging: { in: ["OPEN", "DRAFT"] },
    ...(q ? { OR: [{ teksKeluhan: { contains: q } }, { id: { contains: q } }] } : {}),
    ...(gedung ? { predLokasiGedung: gedung } : {}),
    ...(lantai ? { predLokasiLantai: lantai } : {}),
    ...(zona ? { predLokasiZona: zona } : {}),
  };

  const activeTickets = await prisma.assetComplaint.findMany({
    where: {
      ...filterAssetComplaint,
      statusTiket: status && ["MENUNGGU_TEKNISI", "PROSES_SERVIS", "MENUNGGU_APPROVAL_GANTI"].includes(status) 
        ? (status as StatusTiket)
        : { notIn: ["SELESAI", "DITOLAK"] },
    },
    orderBy: { tanggalPerencanaan: "desc" },
    include: { teknisiPelaksana: true, asset: true },
  });

  const teknisiList = await prisma.user.findMany({
    where: { role: "TEKNISI" },
    select: { id: true, nama: true, username: true }
  });

  const [historyTickets, totalHistory, stagingTickets] = await Promise.all([
    prisma.assetComplaint.findMany({
      where: {
        ...filterAssetComplaint,
        statusTiket: status && ["SELESAI", "DITOLAK"].includes(status)
          ? (status as StatusTiket)
          : { in: ["SELESAI", "DITOLAK"] },
      },
      orderBy: { tanggalPerencanaan: "desc" },
      include: { teknisiPelaksana: true, asset: true },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.assetComplaint.count({
      where: {
        ...filterAssetComplaint,
        statusTiket: status && ["SELESAI", "DITOLAK"].includes(status)
          ? (status as StatusTiket)
          : { in: ["SELESAI", "DITOLAK"] },
      },
    }),
    prisma.komplainPerbaikan.findMany({
      where: filterStaging,
      orderBy: { tanggalDibuat: "desc" },
    }),
  ]);

  // Load distinct filter options
  const [gedungList, lantaiList, zonaList, kerusakanList] = await Promise.all([
    prisma.masterAsset.findMany({ select: { lokasiGedung: true }, distinct: ['lokasiGedung'] }).then(res => res.map(r => r.lokasiGedung).filter(Boolean)),
    prisma.masterAsset.findMany({ select: { lokasiLantai: true }, distinct: ['lokasiLantai'] }).then(res => res.map(r => r.lokasiLantai).filter(Boolean)),
    prisma.masterAsset.findMany({ select: { lokasiZona: true }, distinct: ['lokasiZona'] }).then(res => res.map(r => r.lokasiZona).filter(Boolean)),
    prisma.assetComplaint.findMany({ select: { jenisKerusakan: true }, distinct: ['jenisKerusakan'] }).then(res => res.map(r => r.jenisKerusakan).filter(k => k && k !== "-")),
  ]);

  const activeIds = activeTickets.map((t) => t.id);
  const historyIds = historyTickets.map((t) => t.id);
  const linkedStaging = await prisma.komplainPerbaikan.findMany({
    where: { id: { in: [...activeIds, ...historyIds] } },
    select: { id: true, teksKeluhan: true },
  });
  const stagingMap = new Map(linkedStaging.map((s) => [s.id, s.teksKeluhan]));

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
                  <AssignAssetModal staging={t} teknisiList={teknisiData} />
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
            <th className="h-10 px-4 text-left font-medium">Keluhan Awal</th>
            <th className="h-10 px-4 text-left font-medium">Diagnosis (Kerusakan)</th>
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
                  <span className="font-medium text-sm block">{t.tipe || "Aset"}</span>
                  <span className="font-heading text-[10px] text-muted-foreground block">{t.namaAset} ({t.idAset})</span>
                </div>
              </td>
              <td className="p-4 align-middle text-xs max-w-[200px] truncate" title={stagingMap.get(t.id) || "-"}>{stagingMap.get(t.id) || "-"}</td>
              <td className="p-4 align-middle text-xs max-w-[150px] truncate" title={t.jenisKerusakan}>{t.jenisKerusakan}</td>
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
                          <AjukanGantiModal tiketId={t.id} namaAset={`${t.tipe || "Aset"} (${t.namaAset})`} isGantiDitolak={t.isGantiDitolak} />
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
                            namaAsetLama={`${t.tipe || "Aset"} (${t.namaAset})`} 
                            merekLama={t.asset?.merek || ""} 
                            modelLama={t.asset?.model || ""}
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
          <h2 className="font-heading text-xl font-bold tracking-tight">Manajemen Tiket</h2>
          <p className="text-sm text-muted-foreground mt-1">Kelola tiket komplain masuk dan riwayat perbaikan.</p>
        </div>
      </div>



      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="font-heading text-sm">Kelola Tiket</CardTitle>
        </CardHeader>
        <CardContent>
          <TiketFilter 
            gedungList={gedungList}
            lantaiList={lantaiList}
            zonaList={zonaList}
            kerusakanList={kerusakanList}
            teknisiList={teknisiList}
          />

          <Tabs defaultValue={tab || "staging"} className="w-full">
            <TabsList className="mb-6 grid w-full max-w-2xl grid-cols-3 p-1 bg-muted/50 rounded-lg">
              <TabsTrigger 
                value="staging" 
                className="font-medium gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-md transition-all rounded-md py-2"
              >
                <MessageSquareWarning className="h-4 w-4" /> Staging NLP ({stagingTickets.length})
              </TabsTrigger>
              <TabsTrigger 
                value="aktif" 
                className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-md transition-all rounded-md py-2"
              >
                Tiket Aktif ({activeTickets.length})
              </TabsTrigger>
              <TabsTrigger 
                value="riwayat" 
                className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-md transition-all rounded-md py-2"
              >
                Riwayat Selesai ({totalHistory})
              </TabsTrigger>
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
