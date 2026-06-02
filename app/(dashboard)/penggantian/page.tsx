import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight } from "lucide-react";
import prisma from "@/lib/prisma";

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

export const metadata = {
  title: "Penggantian Aset",
  description: "Riwayat penggantian aset lama ke aset baru beserta alasan dan biaya.",
};

export default async function PenggantianPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = 50; // Tampilkan 50 per halaman

  const [replacementHistoryDb, totalCount] = await Promise.all([
    prisma.replacementHistory.findMany({
      orderBy: { tanggalPenggantian: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.replacementHistory.count(),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

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
            Riwayat Penggantian ({totalCount} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border-0 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-2px_rgba(0,0,0,0.05)] overflow-x-auto bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/60 border-b">
                  <TableHead>ID Lama</TableHead>
                  <TableHead>Tipe Aset</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Nama Aset Lama</TableHead>
                  <TableHead className="text-center">→</TableHead>
                  <TableHead>ID Baru</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Biaya</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replacementHistoryDb.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-heading font-bold text-primary hover:underline cursor-pointer">{r.idAsetLama}</TableCell>
                    <TableCell className="font-medium">{r.tipe}</TableCell>
                    <TableCell className="text-muted-foreground">{r.kategori}</TableCell>
                    <TableCell className="text-muted-foreground">{r.namaAsetLama}</TableCell>
                    <TableCell className="text-center">
                      <ArrowRight className="h-4 w-4 text-sky-500 font-bold mx-auto" />
                    </TableCell>
                    <TableCell className="font-heading text-primary font-bold hover:underline cursor-pointer">{r.idAsetBaru}</TableCell>
                    <TableCell>{formatDate(r.tanggalPenggantian)}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{r.alasanPenggantian}</TableCell>
                    <TableCell className="font-heading text-right font-semibold">{formatRupiah(r.biayaPenggantian)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
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
        </CardContent>
      </Card>
    </div>
  );
}
