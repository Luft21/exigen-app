"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
import { masterAssets, type MasterAsset, type AssetStatus } from "@/lib/data";
import { ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type SortKey = "sisaUmurHari" | "nama" | "id";
type SortDir = "asc" | "desc";

export function AssetTable() {
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLokasi, setFilterLokasi] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("sisaUmurHari");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const categories = useMemo(() => [...new Set(masterAssets.map((a) => a.kategori))], []);
  const locations = useMemo(() => [...new Set(masterAssets.map((a) => a.lokasiGedung))], []);
  const statuses: AssetStatus[] = ["Healthy", "Watch", "Warning", "Critical"];

  const filtered = useMemo(() => {
    let list = [...masterAssets];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.nama.toLowerCase().includes(q)
      );
    }
    if (filterKategori !== "all") list = list.filter((a) => a.kategori === filterKategori);
    if (filterStatus !== "all") list = list.filter((a) => a.healthStatus === filterStatus);
    if (filterLokasi !== "all") list = list.filter((a) => a.lokasiGedung === filterLokasi);

    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return list;
  }, [search, filterKategori, filterStatus, filterLokasi, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const umurHariNow = (a: MasterAsset) => {
    const inst = new Date(a.tanggalInstalasi).getTime();
    const now = new Date("2026-05-17").getTime();
    return Math.floor((now - inst) / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
      <CardHeader>
        <CardTitle className="font-heading text-sm">Daftar Aset</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari ID atau nama aset..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
              id="asset-search"
            />
          </div>
          <Select value={filterKategori} onValueChange={setFilterKategori}>
            <SelectTrigger className="w-[150px] h-9 text-sm" id="filter-kategori">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterLokasi} onValueChange={setFilterLokasi}>
            <SelectTrigger className="w-[150px] h-9 text-sm" id="filter-lokasi">
              <SelectValue placeholder="Lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] h-9 text-sm" id="filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/60">
                <TableHead className="w-[100px]">
                  <Button variant="ghost" size="sm" className="h-7 px-1 text-xs" onClick={() => toggleSort("id")}>
                    ID <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-7 px-1 text-xs" onClick={() => toggleSort("nama")}>
                    Nama <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Kategori</TableHead>
                <TableHead className="hidden lg:table-cell">Lokasi</TableHead>
                <TableHead className="text-right">Umur</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" className="h-7 px-1 text-xs" onClick={() => toggleSort("sisaUmurHari")}>
                    Sisa Umur <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow
                  key={a.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-heading text-xs">
                    <Link href={`/aset/${a.id}`} className="hover:underline text-primary">
                      {a.id}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{a.nama}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{a.kategori}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{a.lokasiGedung}</TableCell>
                  <TableCell className="text-right font-heading text-xs">{umurHariNow(a)} hari</TableCell>
                  <TableCell className="text-right font-heading text-xs font-semibold">{a.sisaUmurHari} hari</TableCell>
                  <TableCell>
                    <StatusBadge status={a.healthStatus} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Tidak ada aset ditemukan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
