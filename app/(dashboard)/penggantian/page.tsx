import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  return "Rp " + new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
                  <TableHead className="min-w-[300px]">Proses Penggantian</TableHead>
                  <TableHead>Kategori & Tipe</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead className="text-right">Logistik (Biaya & Tgl)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replacementHistoryDb.map((r) => (
                  <TableRow key={r.id}>
                    {/* Kolom 1: Proses Penggantian (Old -> New) */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {/* Aset Lama (Muted/Grey) */}
                        <div className="flex flex-col items-end text-muted-foreground opacity-80 min-w-[120px]">
                          <span className="font-heading font-medium text-xs truncate max-w-[140px]" title={r.namaAsetLama}>
                            {r.namaAsetLama || "Unknown"}
                          </span>
                          <span className="text-[10px]">ID: {r.idAsetLama}</span>
                        </div>
                        
                        {/* Ikon Transisi */}
                        <div className="bg-muted p-1.5 rounded-full shrink-0 flex items-center justify-center">
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        
                        {/* Aset Baru (Bold/Accent) */}
                        <div className="flex flex-col items-start min-w-[120px]">
                          <span className="font-heading font-bold text-primary truncate max-w-[140px]">
                            {r.idAsetBaru}
                          </span>
                          <span className="text-[10px] font-semibold text-primary/70">
                            ASET BARU
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Kolom 2: Info Aset */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{r.tipe}</span>
                        <span className="text-xs text-muted-foreground">{r.kategori}</span>
                      </div>
                    </TableCell>

                    {/* Kolom 3: Alasan Penggantian (Badge) */}
                    <TableCell>
                      <Badge variant="outline" className="bg-accent/30 text-accent-foreground border-accent/50 font-medium text-xs whitespace-nowrap max-w-[220px] truncate block overflow-hidden" title={r.alasanPenggantian}>
                        {r.alasanPenggantian}
                      </Badge>
                    </TableCell>

                    {/* Kolom 4: Logistik */}
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-heading font-bold text-sm">{formatRupiah(r.biayaPenggantian)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(r.tanggalPenggantian)}</span>
                      </div>
                    </TableCell>
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
