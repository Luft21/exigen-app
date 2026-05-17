import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { replacementHistory, formatDate, formatRupiah } from "@/lib/data";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Penggantian Aset",
  description: "Riwayat penggantian aset lama ke aset baru beserta alasan dan biaya.",
};

export default function PenggantianPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Penggantian Aset</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Riwayat penggantian aset lama ke aset baru beserta alasan dan estimasi biaya.
        </p>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="font-heading text-sm">
            Riwayat Penggantian ({replacementHistory.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/60">
                  <TableHead className="text-xs">ID Lama</TableHead>
                  <TableHead className="text-xs">Nama Aset Lama</TableHead>
                  <TableHead className="text-xs">Kategori</TableHead>
                  <TableHead className="text-xs">Tipe</TableHead>
                  <TableHead className="text-xs text-center">→</TableHead>
                  <TableHead className="text-xs">ID Baru</TableHead>
                  <TableHead className="text-xs">Tanggal</TableHead>
                  <TableHead className="text-xs">Alasan</TableHead>
                  <TableHead className="text-xs text-right">Biaya</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replacementHistory.map((r) => (
                  <TableRow key={r.idAsetLama}>
                    <TableCell className="font-heading text-xs">{r.idAsetLama}</TableCell>
                    <TableCell className="text-xs font-medium">{r.namaAsetLama}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.kategori}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.tipe}</TableCell>
                    <TableCell className="text-center">
                      <ArrowRight className="h-3.5 w-3.5 text-accent-custom mx-auto" />
                    </TableCell>
                    <TableCell className="font-heading text-xs text-primary font-semibold">{r.idAsetBaru}</TableCell>
                    <TableCell className="text-xs">{formatDate(r.tanggalPenggantian)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">{r.alasanPenggantian}</TableCell>
                    <TableCell className="text-xs font-heading text-right font-semibold">{formatRupiah(r.biayaPenggantian)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
