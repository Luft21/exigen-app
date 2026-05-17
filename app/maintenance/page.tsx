import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { assetComplaints, formatDate, formatRupiah } from "@/lib/data";

export const metadata = {
  title: "Maintenance",
  description: "Riwayat maintenance dan perbaikan seluruh aset.",
};

const severityColor: Record<string, string> = {
  Ringan: "bg-success/15 text-success border-success/30",
  Sedang: "bg-watch/15 text-watch border-watch/30",
  Berat: "bg-warning/15 text-warning border-warning/30",
  Kritis: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function MaintenancePage() {
  const sorted = [...assetComplaints].sort(
    (a, b) =>
      new Date(b.tanggalPerencanaan).getTime() -
      new Date(a.tanggalPerencanaan).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Maintenance</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Riwayat lengkap kerusakan, perbaikan, dan biaya maintenance seluruh aset.
        </p>
      </div>

      <Card className="animate-fade-in-up overflow-hidden">
        <CardHeader>
          <CardTitle className="font-heading text-sm">
            Riwayat Maintenance ({sorted.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full caption-bottom text-sm" style={{ minWidth: "1100px" }}>
              <thead className="[&_tr]:border-b bg-muted/60">
                <tr className="border-b">
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">ID</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Aset</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Tgl Perencanaan</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Tgl Pengerjaan</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Tgl Selesai</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Jenis Kerusakan</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Severity</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Penyebab</th>
                  <th className="h-10 px-4 text-right align-middle font-medium whitespace-nowrap text-foreground text-xs">Biaya</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Spare Part</th>
                  <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground text-xs">Teknisi</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {sorted.map((c) => (
                  <tr key={c.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle whitespace-nowrap font-heading text-xs">{c.id}</td>
                    <td className="p-4 align-middle whitespace-nowrap text-xs">
                      <div>
                        <span className="font-heading text-[10px] text-muted-foreground block">{c.idAset}</span>
                        <span className="font-medium">{c.namaAset}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap text-xs">{formatDate(c.tanggalPerencanaan)}</td>
                    <td className="p-4 align-middle whitespace-nowrap text-xs">{formatDate(c.tanggalPengerjaan)}</td>
                    <td className="p-4 align-middle whitespace-nowrap text-xs">{formatDate(c.tanggalSelesai)}</td>
                    <td className="p-4 align-middle whitespace-nowrap text-xs font-medium">{c.jenisKerusakan}</td>
                    <td className="p-4 align-middle whitespace-nowrap">
                      <Badge variant="outline" className={`text-[9px] ${severityColor[c.severity]}`}>
                        {c.severity}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap text-xs text-muted-foreground max-w-[180px] truncate">{c.penyebab}</td>
                    <td className="p-4 align-middle whitespace-nowrap text-xs font-heading text-right">{formatRupiah(c.biayaPerbaikan)}</td>
                    <td className="p-4 align-middle whitespace-nowrap text-xs text-muted-foreground max-w-[180px] truncate">{c.sparePartDigunakan}</td>
                    <td className="p-4 align-middle whitespace-nowrap text-xs">{c.teknisiPelaksana}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
