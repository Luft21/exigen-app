"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { assignStagingKeAset } from "@/app/actions/ticket";
import { CheckCircle, AlertTriangle, Building2, MapPin, Wrench } from "lucide-react";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

export function AssignAssetModal({ staging, assets, teknisiList }: { staging: any; assets: any[]; teknisiList: any[] }) {
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [selectedTeknisi, setSelectedTeknisi] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Algoritma Scoring Aset
  const scoredAssets = useMemo(() => {
    return assets.map(a => {
      let score = 0;
      const tAset = staging.predTipeAset.toLowerCase();
      const aTipe = a.tipe.toLowerCase();
      const aKat = a.kategori.toLowerCase();
      
      // Match Tipe / Kategori
      if (aTipe.includes(tAset) || tAset.includes(aTipe)) score += 50;
      else if (aKat.includes(tAset) || tAset.includes(aKat)) score += 20;

      // Match Gedung
      if (a.lokasiGedung.toLowerCase() === staging.predLokasiGedung.toLowerCase()) score += 30;
      
      // Match Lantai
      const tLantai = staging.predLokasiLantai.toLowerCase();
      const aLantai = a.lokasiLantai.toLowerCase();
      if (tLantai === aLantai || tLantai.includes(aLantai) || aLantai.includes(tLantai)) score += 15;

      // Match Zona
      const tZona = staging.predLokasiZona.toLowerCase();
      const aZona = a.lokasiZona.toLowerCase();
      if (tZona === aZona || tZona.includes(aZona) || aZona.includes(tZona)) score += 10;

      return { ...a, score };
    }).sort((a, b) => b.score - a.score);
  }, [assets, staging]);

  const filteredAssets = scoredAssets.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.nama.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.lokasiGedung.toLowerCase().includes(q)
    );
  }).slice(0, 15); // Batasi 15 hasil agar tidak berat

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="h-8 gap-1">
          <CheckCircle className="h-3 w-3" /> Assign Aset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validasi & Assign Aset</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ringkasan NLP */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Tebakan NLP (Sistem)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block mb-1">Tipe / Kategori</span>
                <span className="font-medium">{staging.predTipeAset}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Severity / Urgensi</span>
                <span className="font-medium">{staging.predSeverityAwal}</span>
              </div>
              <div className="col-span-2 pt-2 border-t flex items-start gap-4">
                <div>
                  <span className="text-muted-foreground flex items-center gap-1 mb-1"><Building2 className="h-3 w-3" /> Gedung</span>
                  <span className="font-medium">{staging.predLokasiGedung}</span>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="h-3 w-3" /> Lokasi</span>
                  <span className="font-medium">{staging.predLokasiLantai.replace("Lantai ", "Lt. ")}, {staging.predLokasiZona}</span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t text-xs">
              <span className="text-muted-foreground block mb-1">Keluhan Asli User:</span>
              <span className="font-medium italic">"{staging.teksKeluhan}"</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pemilihan Aset Aktual */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">1. Pilih Aset Fisik Aktual</h4>
              <input 
                type="text" 
                placeholder="Cari aset (nama, kode, gedung)..." 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              
              <div className="max-h-[250px] overflow-y-auto border rounded-md divide-y">
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((a, index) => (
                    <div 
                      key={a.id} 
                      className={`p-3 text-sm cursor-pointer transition-colors hover:bg-muted ${selectedAsset === a.id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                      onClick={() => setSelectedAsset(a.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold block flex items-center gap-2">
                            {a.nama} 
                            {index === 0 && search === "" && a.score > 30 && (
                              <span className="text-[9px] bg-success/20 text-success px-1.5 py-0.5 rounded-full border border-success/30">Top Match</span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">{a.lokasiGedung}, {a.lokasiLantai}</span>
                        </div>
                        <span className="text-[10px] bg-secondary px-2 py-1 rounded">{a.kategori}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">Tidak ada aset ditemukan.</div>
                )}
              </div>
            </div>

            {/* Penugasan Teknisi */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">2. Penugasan Teknisi</h4>
              
              <div className="grid gap-2">
                <Label htmlFor="teknisi">Tugaskan Ke</Label>
                <select 
                  id="teknisi"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedTeknisi}
                  onChange={(e) => setSelectedTeknisi(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Pilih Teknisi --</option>
                  {teknisiList.map(t => (
                    <option key={t.id} value={t.id}>{t.nama} ({t.username})</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-muted/50 rounded-md border text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <Wrench className="h-4 w-4 mt-0.5 shrink-0" />
                  Tiket akan masuk ke dashboard teknisi yang dipilih dengan status "Menunggu Teknisi". Tanggal pengerjaan akan tercatat saat teknisi menekan tombol "Mulai Servis".
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleAssign} disabled={!selectedAsset || !selectedTeknisi || loading}>
            {loading ? "Menyimpan..." : "Buat Tiket Aktif"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
