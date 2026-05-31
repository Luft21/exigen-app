"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle, PackagePlus, AlertCircle } from "lucide-react";
import { approvePenggantian } from "@/app/actions/ticket";
import Swal from "sweetalert2";

export function ApproveGantiModal({ 
  tiketId, 
  namaAsetLama, 
  merekLama, 
  modelLama
}: { 
  tiketId: string; 
  namaAsetLama: string;
  merekLama: string;
  modelLama: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayBiaya, setDisplayBiaya] = useState("");
  const [rawBiaya, setRawBiaya] = useState("");

  // Helper untuk ID Aset Suggestion
  const getSuggestedId = () => {
    return `AST-${Math.floor(Math.random() * 10000)}`;
  };

  const handleBiayaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hapus karakter non-digit
    const digits = e.target.value.replace(/\D/g, "");
    setRawBiaya(digits);
    
    // Format ke currency dengan koma
    if (digits) {
      setDisplayBiaya(parseInt(digits, 10).toLocaleString('en-US')); // menggunakan koma (en-US)
    } else {
      setDisplayBiaya("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("idTiket", tiketId);
      formData.append("biaya", rawBiaya); // Ganti biaya dengan nilai raw yang tidak ada komanya
      await approvePenggantian(formData);
      setOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Aset Berhasil Diganti!',
        text: 'Aset baru telah diregistrasi ke sistem.',
        confirmButtonColor: '#10b981'
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Gagal menyetujui penggantian',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="h-8 gap-1 bg-success hover:bg-success/90">
          <CheckCircle className="h-3 w-3" /> Setujui & Ganti
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" /> Registrasi Aset Pengganti
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="bg-primary/10 p-3 rounded-md border border-primary/20 text-sm text-primary">
            Anda menyetujui penggantian untuk aset <strong>{namaAsetLama}</strong>. Aset lama akan dipensiunkan (dinonaktifkan) dan aset baru di bawah ini akan didaftarkan ke sistem.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="idAsetBaru">ID Barcode / SN Aset Baru</Label>
              <Input
                id="idAsetBaru"
                name="idAsetBaru"
                defaultValue={getSuggestedId()}
                placeholder="Contoh: 105"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="displayBiaya">Biaya Pembelian (Rp)</Label>
              <Input
                id="displayBiaya"
                type="text"
                placeholder="Contoh: 5,500,000"
                value={displayBiaya}
                onChange={handleBiayaChange}
                required
              />
              <input type="hidden" name="biaya" value={rawBiaya} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="merek">Merek Aset Baru</Label>
              <Input
                id="merek"
                name="merek"
                defaultValue={merekLama}
                required
              />
              <p className="text-[10px] text-muted-foreground">* Default mengikuti merek lama, ubah jika beda merek.</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="model">Model / Tipe Baru</Label>
              <Input
                id="model"
                name="model"
                defaultValue={modelLama}
                required
              />
            </div>
          </div>
          
          <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground flex items-start gap-2 border">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Sistem akan otomatis mewariskan data <strong>Gedung, Lantai, Zona, Kategori, Tipe, dan Tingkat Kekritisan</strong> dari aset lama ke aset baru ini. Umur mesin akan dihitung dari 0 hari (tanggal instalasi hari ini).</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Simpan Aset Baru"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
