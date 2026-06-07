"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Search, ChevronLeft, ChevronRight, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

// Aset dengan status Warning atau Critical dapat diperbaiki oleh teknisi
const EDITABLE_STATUSES = ["Warning", "Critical"];

interface AssetTableProps {
  initialAssets: any[];
  categories: string[];
  currentPage: number;
  totalPages: number;
  searchParams: any;
  isTeknisi?: boolean;
}

export function AssetTable({
  initialAssets,
  categories,
  currentPage,
  totalPages,
  searchParams,
  isTeknisi = false,
}: AssetTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.q || "");

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParamsHook.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    updateQuery("q", searchValue);
  };

  const umurHariNow = (tanggalInstalasi: Date) =>
    Math.floor((Date.now() - new Date(tanggalInstalasi).getTime()) / 86_400_000);

  const hasEditCol = isTeknisi;

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
      <CardHeader>
        <CardTitle className="font-heading text-sm">Daftar Aset</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] flex items-center gap-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari ID atau nama aset... (Tekan Enter)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            <Button type="submit" size="sm" variant="secondary" className="h-9">
              Cari
            </Button>
          </div>

          <Select
            value={searchParams.category || "all"}
            onValueChange={(val) => updateQuery("category", val)}
          >
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.status || "all"}
            onValueChange={(val) => updateQuery("status", val)}
          >
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Healthy">Healthy</SelectItem>
              <SelectItem value="Watch">Watch</SelectItem>
              <SelectItem value="Warning">Warning</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </form>

        {/* Hint untuk teknisi */}
        {isTeknisi && (
          <p className="mb-3 text-xs text-muted-foreground flex items-center gap-1.5">
            <Wrench className="h-3 w-3 shrink-0" />
            Tombol <strong>Perbaiki</strong> muncul pada aset berstatus <strong>Warning</strong> atau <strong>Critical</strong>.
          </p>
        )}

        {/* Table */}
        <div className="rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/60">
                <TableHead>ASET</TableHead>
                <TableHead className="hidden md:table-cell">Kategori</TableHead>
                <TableHead className="hidden lg:table-cell">Lokasi</TableHead>
                <TableHead className="text-right">Umur Skrg</TableHead>
                <TableHead className="text-right">Sisa Umur</TableHead>
                <TableHead>Status</TableHead>
                {hasEditCol && <TableHead className="w-[100px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialAssets.map((a) => {
                let dynamicStatus: "Healthy" | "Critical" | "Warning" | "Watch" = "Healthy";
                if (a.sisaUmurHari <= 30) dynamicStatus = "Critical";
                else if (a.sisaUmurHari <= 90) dynamicStatus = "Warning";
                else if (a.sisaUmurHari <= 180) dynamicStatus = "Watch";

                const canEdit = isTeknisi && EDITABLE_STATUSES.includes(dynamicStatus);
                const isCritical = dynamicStatus === "Critical";
                const isWarning  = dynamicStatus === "Warning";

                return (
                  <TableRow
                    key={a.id}
                    className={`transition-colors hover:bg-muted/50 ${
                      isCritical
                        ? "bg-destructive/5 hover:bg-destructive/10"
                        : isWarning
                        ? "bg-warning/5 hover:bg-warning/10"
                        : ""
                    }`}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                          {a.tipe}
                        </span>
                        <Link
                          href={`/aset/${a.id}`}
                          className="text-xs text-muted-foreground font-mono hover:underline hover:text-primary mt-0.5"
                        >
                          {a.nama} ({a.id})
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {a.kategori}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {a.lokasiGedung}
                    </TableCell>
                    <TableCell className="text-right font-heading text-xs">
                      {umurHariNow(a.tanggalInstalasi)} hari
                    </TableCell>
                    <TableCell
                      className={`text-right font-heading text-xs font-semibold ${
                        isCritical
                          ? "text-destructive"
                          : isWarning
                          ? "text-warning"
                          : ""
                      }`}
                    >
                      {a.sisaUmurHari} hari
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={dynamicStatus} />
                    </TableCell>
                    {hasEditCol && (
                      <TableCell>
                        {canEdit ? (
                          <Link
                            href={`/input-servis?idAset=${a.id}`}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
                              isCritical
                                ? "text-destructive border-destructive/30 hover:bg-destructive/10"
                                : "text-warning border-warning/30 hover:bg-warning/10"
                            }`}
                          >
                            <Wrench className="h-3 w-3 shrink-0" />
                            Perbaiki
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground/30">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {initialAssets.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={hasEditCol ? 7 : 6}
                    className="text-center text-muted-foreground py-8"
                  >
                    Tidak ada aset ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuery("page", String(currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuery("page", String(currentPage + 1))}
                disabled={currentPage >= totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
