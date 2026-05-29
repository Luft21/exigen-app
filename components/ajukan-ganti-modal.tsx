"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { ajukanPenggantian } from "@/app/actions/ticket";
import Swal from "sweetalert2";

export function AjukanGantiModal({ tiketId, namaAset, isGantiDitolak = false }: { tiketId: string; namaAset: string; isGantiDitolak?: boolean }) {
  const [open, setOpen] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("idTiket", tiketId);
      formData.append("alasan", alasan);
      await ajukanPenggantian(formData);
      setOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Diajukan',
        text: 'Permintaan penggantian aset telah dikirim ke Manajemen.',
        confirmButtonColor: '#10b981'
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal mengajukan penggantian.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive border-destructive/50 hover:bg-destructive hover:text-destructive-foreground">
          <CheckCircle className="h-3 w-3" /> Ajukan Ganti
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Ajukan Penggantian Aset
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 text-sm text-destructive">
            Anda akan mengajukan penggantian untuk aset <strong>{namaAset}</strong>. Tiket ini akan ditunda hingga mendapat persetujuan dari Manajemen / Admin.
          </div>

          {isGantiDitolak && (
            <div className="bg-orange-500/10 p-3 rounded-md border border-orange-500/20 text-sm text-orange-600 font-medium">
              ⚠️ Pengajuan penggantian untuk tiket ini sebelumnya telah DITOLAK oleh Manajemen. Pastikan Anda memiliki alasan (Root Cause) yang lebih kuat jika ingin mengajukan ulang!
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="alasan">Alasan Penggantian (Root Cause)</Label>
            <Textarea
              id="alasan"
              placeholder="Contoh: Kompresor terbakar total, biaya perbaikan melebihi harga beli baru..."
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" variant="destructive" disabled={!alasan || loading}>
              {loading ? "Mengajukan..." : "Kirim Pengajuan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
