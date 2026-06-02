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
  activeTab,
}: {
  gedungList: string[];
  lantaiList: string[];
  zonaList: string[];
  kerusakanList: string[];
  teknisiList: { id: string; nama: string }[];
  activeTab?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  let initialStatus = searchParams.get("status") || "";
  
  if (activeTab === "staging" && initialStatus !== "OPEN") {
    initialStatus = "";
  } else if (activeTab === "aktif" && !["MENUNGGU_TEKNISI", "PROSES_SERVIS", "MENUNGGU_APPROVAL_GANTI"].includes(initialStatus)) {
    initialStatus = "";
  } else if (activeTab === "riwayat" && !["SELESAI", "DITOLAK"].includes(initialStatus)) {
    initialStatus = "";
  }

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [gedung, setGedung] = useState(searchParams.get("gedung") || "");
  const [lantai, setLantai] = useState(searchParams.get("lantai") || "");
  const [zona, setZona] = useState(searchParams.get("zona") || "");
  const [kerusakan, setKerusakan] = useState(searchParams.get("kerusakan") || "");
  const [teknisi, setTeknisi] = useState(searchParams.get("teknisi") || "");
  const [status, setStatus] = useState(initialStatus);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q); else params.delete("q");
    if (gedung && gedung !== "all") params.set("gedung", gedung); else params.delete("gedung");
    if (lantai && lantai !== "all") params.set("lantai", lantai); else params.delete("lantai");
    if (zona && zona !== "all") params.set("zona", zona); else params.delete("zona");
    if (kerusakan && kerusakan !== "all") params.set("kerusakan", kerusakan); else params.delete("kerusakan");
    if (teknisi && teknisi !== "all") params.set("teknisi", teknisi); else params.delete("teknisi");
    if (status && status !== "all") params.set("status", status); else params.delete("status");
    if (activeTab) params.set("tab", activeTab);
    
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
    if (activeTab) params.set("tab", activeTab);
    
    router.push(`?${params.toString()}`);
  };

  const activeFiltersCount = [gedung, lantai, zona, kerusakan, teknisi].filter(v => v && v !== "all").length;

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
          <Select value={status || "all"} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-full sm:w-[150px]"><SelectValue placeholder="Status Tiket" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {(!activeTab || activeTab === "staging") && <SelectItem value="OPEN">OPEN</SelectItem>}
              {(!activeTab || activeTab === "aktif") && <SelectItem value="MENUNGGU_TEKNISI">Menunggu Teknisi</SelectItem>}
              {(!activeTab || activeTab === "aktif") && <SelectItem value="PROSES_SERVIS">Proses Servis</SelectItem>}
              {(!activeTab || activeTab === "aktif") && <SelectItem value="MENUNGGU_APPROVAL_GANTI">Menunggu Approval</SelectItem>}
              {(!activeTab || activeTab === "riwayat") && <SelectItem value="SELESAI">Selesai</SelectItem>}
              {(!activeTab || activeTab === "riwayat") && <SelectItem value="DITOLAK">Ditolak</SelectItem>}
            </SelectContent>
          </Select>

          <Button 
            variant={showAdvanced ? "secondary" : "outline"} 
            size="sm" 
            className="h-9 whitespace-nowrap"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-3 w-3 mr-2" /> 
            Filter Lanjutan
            {activeFiltersCount > 0 && (
              <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <Button variant="default" size="sm" onClick={handleFilter} className="h-9 whitespace-nowrap hidden sm:flex">
            Terapkan
          </Button>
        </div>
      </div>

      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-2 pt-2 animate-in slide-in-from-top-2">
          <Select value={gedung || "all"} onValueChange={setGedung}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Gedung" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Gedung</SelectItem>
              {gedungList.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={lantai || "all"} onValueChange={setLantai}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Lantai" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lantai</SelectItem>
              {lantaiList.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={zona || "all"} onValueChange={setZona}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Zona" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Zona</SelectItem>
              {zonaList.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={kerusakan || "all"} onValueChange={setKerusakan}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Jenis Kerusakan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kerusakan</SelectItem>
              {kerusakanList.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={teknisi || "all"} onValueChange={setTeknisi}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Teknisi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Teknisi</SelectItem>
              {teknisiList.map(t => <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t mt-4 sm:hidden">
        <Button variant="default" size="sm" onClick={handleFilter} className="h-9 w-full">
          Terapkan Filter
        </Button>
      </div>
      
      {activeFiltersCount > 0 && (
        <div className="flex justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3 mr-1" /> Reset Filter
          </Button>
        </div>
      )}
    </div>
  );
}
