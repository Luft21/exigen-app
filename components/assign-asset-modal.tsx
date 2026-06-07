"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { assignStagingKeAset } from "@/app/actions/ticket";
import { CheckCircle, AlertTriangle, Building2, MapPin, Wrench, Search, Cpu } from "lucide-react";
import { Label } from "@/components/ui/label";
import { searchAssetsForStaging } from "@/app/actions/asset";
import { SeverityBadge } from "@/components/severity-badge";
import Swal from "sweetalert2";

export function AssignAssetModal({ staging, teknisiList }: { staging: any; teknisiList: any[] }) {
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [selectedTeknisi, setSelectedTeknisi] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    const loadAssets = async () => {
      setLoadingAssets(true);
      try {
        const result = await searchAssetsForStaging(staging, search);
        setFilteredAssets(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAssets(false);
      }
    };

    // Debounce search
    const timer = setTimeout(loadAssets, 300);
    return () => clearTimeout(timer);
  }, [search, staging, open]);

  const handleAssign = async () => {
    if (!selectedAsset) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops...',
        text: 'Pilih aset terlebih dahulu'
      });
      return;
    }
    if (!selectedTeknisi) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops...',
        text: 'Pilih teknisi yang akan ditugaskan'
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("idStaging", staging.id);
      formData.append("idAset", selectedAsset);
      formData.append("idTeknisi", selectedTeknisi);
      await assignStagingKeAset(formData);
      setOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Sukses!',
        text: 'Aset berhasil di-assign ke teknisi.',
        confirmButtonColor: '#10b981'
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal melakukan assign aset',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFatalOrKritis = ["Fatal", "Kritis"].includes(staging.predSeverityAwal);
  const isTinggiOrBerat = ["Tinggi", "Berat"].includes(staging.predSeverityAwal);
  const isSedang = staging.predSeverityAwal === "Sedang";

  const nlpPanelStyle = isFatalOrKritis 
    ? "border-rose-200/60 bg-rose-50/30 dark:border-rose-950/40 dark:bg-rose-950/10"
    : isTinggiOrBerat
    ? "border-orange-200/60 bg-orange-50/30 dark:border-orange-950/40 dark:bg-orange-950/10"
    : isSedang
    ? "border-amber-200/60 bg-amber-50/30 dark:border-amber-950/40 dark:bg-amber-950/10"
    : "border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-950/40 dark:bg-emerald-950/10";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10 transition-colors" title="Assign Aset">
          <CheckCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto border-white/10 dark:border-white/5 shadow-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="font-heading text-lg font-bold tracking-tight">Validasi & Assign Aset</DialogTitle>
        </DialogHeader>
 
        <div className="space-y-6 py-4">
          {/* Ringkasan NLP */}
          <div className={`rounded-xl border p-4 space-y-3 shadow-sm transition-all duration-300 ${nlpPanelStyle}`}>
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Cpu className="h-4 w-4 text-primary animate-pulse" /> Prediksi NLP Aset & Lokasi
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block mb-1">Tipe / Kategori Terdeteksi</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{staging.predTipeAset}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Severity / Urgensi</span>
                <SeverityBadge severity={staging.predSeverityAwal} />
              </div>
              <div className="col-span-2 pt-3 border-t border-dashed flex items-start gap-8">
                <div>
                  <span className="text-muted-foreground flex items-center gap-1.5 mb-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" /> Gedung
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{staging.predLokasiGedung}</span>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center gap-1.5 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> Lantai & Zona
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {staging.predLokasiLantai.replace("Lantai ", "Lt. ")}, {staging.predLokasiZona}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-dashed text-xs">
              <span className="text-muted-foreground block mb-1.5 font-medium">Keluhan Asli User:</span>
              <div className="bg-background/60 p-3 rounded-lg border border-border/50 font-serif italic text-slate-700 dark:text-slate-300 leading-relaxed shadow-inner">
                "{staging.teksKeluhan}"
              </div>
            </div>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Pemilihan Aset Aktual */}
            <div className="md:col-span-7 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">1. Pilih Aset Fisik Aktual</h4>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Cari aset (nama, kode, gedung)..." 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="max-h-[280px] overflow-y-auto border rounded-xl divide-y divide-border/40 p-1 bg-muted/10 space-y-1">
                {loadingAssets ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> 
                    Mencari aset...
                  </div>
                ) : filteredAssets.length > 0 ? (
                  filteredAssets.map((a, index) => (
                    <div 
                      key={a.id} 
                      className={`p-3 text-sm cursor-pointer transition-all border border-transparent rounded-lg flex justify-between items-start gap-2 ${
                        selectedAsset === a.id 
                          ? 'bg-primary/5 border-primary ring-1 ring-primary/25 shadow-sm' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-border/60'
                      }`}
                      onClick={() => setSelectedAsset(a.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex flex-wrap items-center gap-1.5 leading-snug">
                          <span className="truncate">{a.nama}</span>
                          {index === 0 && search === "" && a.score > 30 && (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20 font-semibold uppercase tracking-wide">Top Match</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground block mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate">{a.lokasiGedung}, Lt. {a.lokasiLantai}, {a.lokasiZona}</span>
                        </span>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-600 dark:text-slate-400">
                            Tipe: {a.tipe}
                          </span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-600 dark:text-slate-400">
                            Model: {a.model || "-"}
                          </span>
                          
                          {a.score > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-muted-foreground font-medium">Match:</span>
                              <div className="h-1.5 w-12 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${a.score >= 50 ? 'bg-emerald-500' : a.score >= 30 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                                  style={{ width: `${Math.min(100, (a.score / 90) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 px-2 py-0.5 rounded-full font-semibold shrink-0 uppercase tracking-wide">{a.kategori}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">Tidak ada aset ditemukan.</div>
                )}
              </div>
            </div>
 
            {/* Penugasan Teknisi */}
            <div className="md:col-span-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">2. Penugasan Teknisi</h4>
              
              <div className="grid gap-2">
                <Label htmlFor="teknisi" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tugaskan Ke</Label>
                <select 
                  id="teknisi"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer hover:border-slate-400 transition-colors"
                  value={selectedTeknisi}
                  onChange={(e: any) => setSelectedTeknisi(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Pilih Teknisi --</option>
                  {teknisiList.map(t => (
                    <option key={t.id} value={t.id}>{t.nama} ({t.username})</option>
                  ))}
                </select>
              </div>
 
              <div className="p-3 bg-blue-50/40 dark:bg-blue-950/10 rounded-xl border border-blue-100/50 dark:border-blue-900/20 text-xs text-muted-foreground">
                <p className="flex items-start gap-2 leading-relaxed">
                  <Wrench className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                  <span>
                    Tiket akan masuk ke dashboard teknisi yang dipilih dengan status <strong>Menunggu Teknisi</strong>. Tanggal pengerjaan akan tercatat saat teknisi mulai menservis.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
 
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-lg">Batal</Button>
          <Button onClick={handleAssign} disabled={!selectedAsset || !selectedTeknisi || loading} className="rounded-lg shadow-sm">
            {loading ? "Menyimpan..." : "Buat Tiket Aktif"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
