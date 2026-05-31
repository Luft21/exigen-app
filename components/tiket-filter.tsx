"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

export function TiketFilter({
  gedungList,
  lantaiList,
  zonaList,
  kerusakanList,
  teknisiList,
}: {
  gedungList: string[];
  lantaiList: string[];
  zonaList: string[];
  kerusakanList: string[];
  teknisiList: { id: string; nama: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [gedung, setGedung] = useState(searchParams.get("gedung") || "");
  const [lantai, setLantai] = useState(searchParams.get("lantai") || "");
  const [zona, setZona] = useState(searchParams.get("zona") || "");
  const [kerusakan, setKerusakan] = useState(searchParams.get("kerusakan") || "");
  const [teknisi, setTeknisi] = useState(searchParams.get("teknisi") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q); else params.delete("q");
    if (gedung && gedung !== "all") params.set("gedung", gedung); else params.delete("gedung");
    if (lantai && lantai !== "all") params.set("lantai", lantai); else params.delete("lantai");
    if (zona && zona !== "all") params.set("zona", zona); else params.delete("zona");
    if (kerusakan && kerusakan !== "all") params.set("kerusakan", kerusakan); else params.delete("kerusakan");
    if (teknisi && teknisi !== "all") params.set("teknisi", teknisi); else params.delete("teknisi");
    if (status && status !== "all") params.set("status", status); else params.delete("status");
    
    // reset page on filter
    params.delete("page");

    router.push(`?${params.toString()}`);
  };

  const handleReset = () => {
    setQ("");
    setGedung("all");
    setLantai("all");
    setZona("all");
    setKerusakan("all");
    setTeknisi("all");
    setStatus("all");
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("gedung");
    params.delete("lantai");
    params.delete("zona");
    params.delete("kerusakan");
    params.delete("teknisi");
    params.delete("status");
    params.delete("page");
    
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Filter className="h-4 w-4" /> Filter Tiket
      </div>
      
      <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari ID Tiket, ID Aset, Nama..." 
            className="pl-8 h-9" 
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
          />
        </div>
        
        <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 xl:justify-end">
          <Select value={gedung || "all"} onValueChange={setGedung}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Gedung" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Gedung</SelectItem>
            {gedungList.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={lantai || "all"} onValueChange={setLantai}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Lantai" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Lantai</SelectItem>
            {lantaiList.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={zona || "all"} onValueChange={setZona}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Zona" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Zona</SelectItem>
            {zonaList.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={kerusakan || "all"} onValueChange={setKerusakan}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Jenis Kerusakan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kerusakan</SelectItem>
            {kerusakanList.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={teknisi || "all"} onValueChange={setTeknisi}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Teknisi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Teknisi</SelectItem>
            {teknisiList.map(t => <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={status || "all"} onValueChange={setStatus}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Status Tiket" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="OPEN">Staging: OPEN</SelectItem>
            <SelectItem value="MENUNGGU_TEKNISI">Aktif: Menunggu Teknisi</SelectItem>
            <SelectItem value="PROSES_SERVIS">Aktif: Proses Servis</SelectItem>
            <SelectItem value="MENUNGGU_APPROVAL_GANTI">Aktif: Menunggu Approval</SelectItem>
            <SelectItem value="SELESAI">Riwayat: Selesai</SelectItem>
            <SelectItem value="DITOLAK">Riwayat: Ditolak</SelectItem>
          </SelectContent>
        </Select>
        </div>

      </div>
      <div className="flex justify-end gap-2 pt-2 border-t mt-4">
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-8">
          <X className="h-3 w-3 mr-1" /> Reset
        </Button>
        <Button variant="default" size="sm" onClick={handleFilter} className="h-8">
          Terapkan Filter
        </Button>
      </div>
    </div>
  );
}
