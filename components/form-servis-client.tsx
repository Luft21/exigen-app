"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { selesaikanServis } from "@/app/actions/ticket";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export function FormServisClient({
  tiket,
  uniqueKerusakan,
  uniquePenyebab,
  uniqueSparepart
}: {
  tiket: any;
  uniqueKerusakan: string[];
  uniquePenyebab: string[];
  uniqueSparepart: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [displayBiaya, setDisplayBiaya] = useState(tiket.biayaPerbaikan ? tiket.biayaPerbaikan.toLocaleString('en-US') : "");
  const [rawBiaya, setRawBiaya] = useState(tiket.biayaPerbaikan ? String(tiket.biayaPerbaikan) : "");

  const handleBiayaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setRawBiaya(digits);
    if (digits) {
      setDisplayBiaya(parseInt(digits, 10).toLocaleString('en-US'));
    } else {
      setDisplayBiaya("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("biayaPerbaikan", rawBiaya); // Ganti dengan angka raw
      
      await selesaikanServis(formData);
      
      Swal.fire({
        icon: 'success',
        title: 'Servis Selesai!',
        text: 'Data perbaikan telah berhasil disimpan.',
        confirmButtonColor: '#10b981'
      }).then(() => {
        router.push("/tiket");
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal menyimpan data perbaikan.',
      });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="idTiket" value={tiket.id} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Tipe Aset</Label>
          <Input value={tiket.tipe || tiket.namaAset} readOnly className="bg-muted/40 font-medium" />
        </div>
        <div className="grid gap-2">
          <Label>Nama / ID Aset</Label>
          <Input value={`${tiket.namaAset} (${tiket.idAset})`} readOnly className="bg-muted/40 text-xs" />
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-md border text-sm space-y-2 mb-6">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Waktu Mulai Kerja:</span>
          <span className="font-medium">{tiket.tanggalPengerjaan ? tiket.tanggalPengerjaan.toLocaleString('id-ID') : '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Waktu Selesai (Saat Ini):</span>
          <span className="font-medium text-success">{new Date().toLocaleString('id-ID')}</span>
        </div>
        <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
          * Waktu penyelesaian akan dicatat secara otomatis ketika Anda menekan tombol simpan.
        </p>
      </div>

      <div className="grid gap-2">
        <Label>Keluhan Awal (Laporan User / NLP)</Label>
        <Input value={tiket.keluhan} readOnly className="bg-muted/40 font-medium" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Rincian Kerusakan (Fakta Diagnosis)</Label>
          <Input 
            name="jenisKerusakan" 
            defaultValue={tiket.jenisKerusakan === "-" ? "" : tiket.jenisKerusakan}
            list="kerusakan-options"
            placeholder="Contoh: AC Mati Total..."
            required 
          />
          <datalist id="kerusakan-options">
            {uniqueKerusakan.map((k, i) => (
              <option key={i} value={k} />
            ))}
          </datalist>
        </div>

        <div className="grid gap-2">
          <Label>Severity Riil (Urgensi Aktual)</Label>
          <select 
            name="severity"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            defaultValue={tiket.severity}
            required
          >
            <option value="Rendah">Rendah</option>
            <option value="Sedang">Sedang</option>
            <option value="Tinggi">Tinggi</option>
            <option value="Fatal">Fatal</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Penyebab (Diagnosa Teknisi)</Label>
        <Input 
          name="penyebab" 
          defaultValue={tiket.penyebab === "-" ? "" : tiket.penyebab.replace("AI: Belum ada saran dari AI", "").trim()}
          list="penyebab-options"
          placeholder="Ketik atau pilih penyebab kerusakan yang sebenarnya ditemukan..."
          required 
        />
        <datalist id="penyebab-options">
          {uniquePenyebab.map((p, i) => (
            <option key={i} value={p} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Biaya Perbaikan (Rp)</Label>
          <Input 
            type="text" 
            placeholder="Contoh: 150,000"
            value={displayBiaya}
            onChange={handleBiayaChange}
            required 
          />
          {/* Biaya yang aslinya dikirim ke backend */}
          <input type="hidden" name="biayaPerbaikan" value={rawBiaya} />
        </div>
        <div className="grid gap-2">
          <Label>Spare Part Digunakan</Label>
          <Input 
            name="sparePartDigunakan" 
            defaultValue={tiket.sparePartDigunakan === "-" ? "" : tiket.sparePartDigunakan}
            list="sparepart-options"
            placeholder="Ketik atau pilih spare part..." 
          />
          <datalist id="sparepart-options">
            {uniqueSparepart.map((s, i) => (
              <option key={i} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Menyimpan..." : "Simpan & Selesaikan Tiket"}
      </Button>
    </form>
  );
}
