import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/severity-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Maintenance",
  description: "Riwayat maintenance dan perbaikan seluruh aset.",
};

// Helpers untuk format data langsung di file agar tidak tergantung lib/data.ts
const formatDate = (date: Date | string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatRupiah = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const tab = params.tab || "aktif";
  const pageSize = 50; // Tampilkan 50 per halaman

  const [activeComplaints, historyComplaints, totalHistory] = await Promise.all([
    prisma.assetComplaint.findMany({
      where: { statusTiket: { notIn: ["SELESAI", "DITOLAK"] } },
      orderBy: { tanggalPerencanaan: "desc" },
      include: { teknisiPelaksana: true, asset: true },
    }),
    prisma.assetComplaint.findMany({
      where: { statusTiket: { in: ["SELESAI", "DITOLAK"] } },
      orderBy: { tanggalPerencanaan: "desc" },
      include: { teknisiPelaksana: true, asset: true },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.assetComplaint.count({
      where: { statusTiket: { in: ["SELESAI", "DITOLAK"] } },
    }),
  ]);

  const complaintIds = [...activeComplaints.map((c) => c.id), ...historyComplaints.map((c) => c.id)];
  const linkedStaging = await prisma.komplainPerbaikan.findMany({
    where: { id: { in: complaintIds } },
    select: { id: true, teksKeluhan: true },
  });
  const stagingMap = new Map(linkedStaging.map((s) => [s.id, s.teksKeluhan]));

  const totalPages = Math.ceil(totalHistory / pageSize);

  const renderTable = (complaints: any[]) => (
    <div className="rounded-xl border-0 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-2px_rgba(0,0,0,0.05)] overflow-x-auto bg-card">
      <table className="w-full caption-bottom text-sm" style={{ minWidth: "1100px" }}>
        <thead className="[&_tr]:border-b bg-muted/60">
          <tr className="border-b">
            <th className="h-12 px-4 text-left align-middle font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">ID</th>
            <th className="h-12 px-4 text-left align-middle font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Aset</th>
            <th className="h-12 px-4 text-left align-middle font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Tgl Perencanaan</th>
            <th className="h-12 px-4 text-left align-middle font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Tgl Pengerjaan</th>
            <th className="h-12 px-4 text-left align-middle font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Tgl Selesai</th>
            <th className="h-12 px-4 text-left align-middle font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Keluhan Awal</th>
            <th className="h-12 px-4 text-left align-middle font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Jenis Kerusakan</th>
            <th className="h-12 px-4 text-left align-middle font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Severity</th>
            <th className="h-12 px-4 text-left align-middle font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Penyebab</th>
            <th className="h-12 px-4 text-right align-middle font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Biaya</th>
            <th className="h-12 px-4 text-left align-middle font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Spare Part</th>
            <th className="h-12 px-4 text-left align-middle font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Teknisi</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {complaints.length === 0 ? (
            <tr>
              <td colSpan={12} className="h-24 text-center text-muted-foreground">Tidak ada data.</td>
            </tr>
          ) : (
            complaints.map((c) => (
              <tr key={c.id} className="border-b transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/20 even:bg-slate-50/50 dark:even:bg-slate-800/30">
                <td className="py-4 px-4 align-middle whitespace-nowrap font-heading text-xs text-primary font-bold hover:underline cursor-pointer">{c.id}</td>
                <td className="py-4 px-4 align-middle whitespace-nowrap text-xs">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      {c.asset?.tipe || "-"}
                    </span>
                    <a
                      href={`/aset/${c.idAset}`}
                      className="text-xs text-muted-foreground font-mono hover:underline hover:text-primary mt-0.5"
                    >
                      {c.namaAset} ({c.idAset})
                    </a>
                  </div>
                </td>
                <td className="py-4 px-4 align-middle whitespace-nowrap text-xs">{formatDate(c.tanggalPerencanaan)}</td>
                <td className="py-4 px-4 align-middle whitespace-nowrap text-xs">{formatDate(c.tanggalPengerjaan)}</td>
                <td className="py-4 px-4 align-middle whitespace-nowrap text-xs">{formatDate(c.tanggalSelesai)}</td>
                <td className="py-4 px-4 align-middle whitespace-nowrap text-xs max-w-[150px] truncate" title={stagingMap.get(c.id) || "-"}>{stagingMap.get(c.id) || "-"}</td>
                <td className="py-4 px-4 align-middle whitespace-nowrap text-xs font-medium max-w-[150px] truncate" title={c.jenisKerusakan}>{c.jenisKerusakan || "-"}</td>
                <td className="py-4 px-4 align-middle whitespace-nowrap">
                  {c.severity ? <SeverityBadge severity={c.severity} /> : <span className="text-muted-foreground">-</span>}
                </td>
                <td className="py-4 px-4 align-middle whitespace-nowrap text-xs text-muted-foreground max-w-[180px] truncate">{c.penyebab || "-"}</td>
                <td className="py-4 px-4 align-middle whitespace-nowrap text-xs font-heading text-right">{c.biayaPerbaikan ? formatRupiah(c.biayaPerbaikan) : "-"}</td>
                <td className="py-4 px-4 align-middle whitespace-nowrap text-xs text-muted-foreground max-w-[180px] truncate">{c.sparePartDigunakan || "-"}</td>
                <td className="py-4 px-4 align-middle whitespace-nowrap text-xs">{c.teknisiPelaksana?.nama || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Maintenance</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Riwayat lengkap kerusakan, perbaikan, dan biaya maintenance seluruh aset.
        </p>
      </div>

      <Tabs defaultValue={tab || "aktif"} className="w-full">
        <TabsList className="mb-6 bg-slate-100/80 dark:bg-slate-800/80 p-1 border border-slate-200/50 dark:border-slate-700/50 rounded-full">
          <TabsTrigger 
            value="aktif"
            className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300"
          >
            Maintenance Aktif
            <span className={`ml-2 inline-flex items-center justify-center text-[10px] font-bold h-5 px-1.5 min-w-[20px] rounded-full transition-colors ${tab === 'aktif' || !tab ? 'bg-white text-primary' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
              {activeComplaints.length}
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="riwayat"
            className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300"
          >
            Riwayat Selesai
            <span className={`ml-2 inline-flex items-center justify-center text-[10px] font-bold h-5 px-1.5 min-w-[20px] rounded-full transition-colors ${tab === 'riwayat' ? 'bg-white text-primary' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
              {totalHistory >= 1000 ? (totalHistory / 1000).toFixed(1) + 'k' : totalHistory}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aktif" className="m-0 animate-fade-in-up">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="font-heading text-sm">
                Maintenance Berjalan ({activeComplaints.length} aset)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable(activeComplaints)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat" className="m-0 animate-fade-in-up">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="font-heading text-sm">
                Riwayat Selesai ({totalHistory} records)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable(historyComplaints)}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Halaman {page} dari {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <a 
                      href={page > 1 ? `?tab=riwayat&page=${page - 1}` : "#"}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 ${page <= 1 ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      Prev
                    </a>
                    <a 
                      href={page < totalPages ? `?tab=riwayat&page=${page + 1}` : "#"}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 ${page >= totalPages ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      Next
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
