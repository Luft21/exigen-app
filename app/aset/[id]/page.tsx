import { notFound } from "next/navigation";
import { masterAssets, assetComplaints, formatDate, formatRupiah } from "@/lib/data";
import { AssetHealthCard } from "@/components/asset-health-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const asset = masterAssets.find((a) => a.id === id);
  return {
    title: asset ? `${asset.nama} (${asset.id})` : "Aset Tidak Ditemukan",
    description: asset
      ? `Detail kesehatan dan riwayat servis ${asset.nama}`
      : "Aset tidak ditemukan dalam database.",
  };
}

const severityColor: Record<string, string> = {
  Ringan: "bg-success/15 text-success border-success/30",
  Sedang: "bg-watch/15 text-watch border-watch/30",
  Berat: "bg-warning/15 text-warning border-warning/30",
  Kritis: "bg-destructive/15 text-destructive border-destructive/30",
};

export default async function AssetDetailPage({ params }: PageProps) {
  const { id } = await params;
  const asset = masterAssets.find((a) => a.id === id);

  if (!asset) return notFound();

  const complaints = assetComplaints
    .filter((c) => c.idAset === asset.id)
    .sort(
      (a, b) =>
        new Date(b.tanggalSelesai).getTime() -
        new Date(a.tanggalSelesai).getTime()
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/aset">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Kembali
          </Link>
        </Button>
      </div>

      <AssetHealthCard asset={asset} />

      {/* Complaint History Table */}
      <Card className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <CardHeader>
          <CardTitle className="font-heading text-sm">
            Riwayat Servis & Kerusakan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada riwayat servis untuk aset ini.
            </p>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/60">
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Tgl Perencanaan</TableHead>
                    <TableHead className="text-xs">Tgl Pengerjaan</TableHead>
                    <TableHead className="text-xs">Tgl Selesai</TableHead>
                    <TableHead className="text-xs">Jenis Kerusakan</TableHead>
                    <TableHead className="text-xs">Severity</TableHead>
                    <TableHead className="text-xs">Penyebab</TableHead>
                    <TableHead className="text-xs text-right">Biaya</TableHead>
                    <TableHead className="text-xs">Teknisi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-heading text-xs">
                        {c.id}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(c.tanggalPerencanaan)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(c.tanggalPengerjaan)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(c.tanggalSelesai)}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {c.jenisKerusakan}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${severityColor[c.severity]}`}
                        >
                          {c.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {c.penyebab}
                      </TableCell>
                      <TableCell className="text-xs font-heading text-right">
                        {formatRupiah(c.biayaPerbaikan)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.teknisiPelaksana}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
