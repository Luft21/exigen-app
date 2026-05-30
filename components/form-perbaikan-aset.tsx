"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { perbaikiAset } from "@/app/actions/asset";
import Swal from "sweetalert2";
import { CheckCircle2 } from "lucide-react";

type Props = {
  aset: {
    id: string;
    nama: string;
    kategori: string;
    subKategori: string;
    tipe: string;
    lokasiGedung: string;
    lokasiLantai: string;
    sisaUmurHari: number;
    healthStatus: string;
    status: string;
    estimasiPenggantian: Date | null;
  };
  uniqueKerusakan: string[];
  uniquePenyebab: string[];
  uniqueSparepart: string[];
};

export function FormPerbaikanAset({
  aset,
  uniqueKerusakan,
  uniquePenyebab,
  uniqueSparepart,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [displayBiaya, setDisplayBiaya] = useState("");
  const [rawBiaya, setRawBiaya] = useState("0");

  const today = new Date().toISOString().split("T")[0];

  const estimasiDefault = aset.estimasiPenggantian
    ? aset.estimasiPenggantian.toISOString().split("T")[0]
    : today;

  const handleBiayaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setRawBiaya(digits || "0");
    setDisplayBiaya(digits ? Number(digits).toLocaleString("id-ID") : "");
  };

  const handleSubmit = async (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("biayaPerbaikan", rawBiaya);
      await perbaikiAset(formData);
      await Swal.fire({
        icon: "success",
        title: "Perbaikan Tercatat!",
        text: "Data perbaikan telah disimpan dan aset diperbarui.",
        confirmButtonColor: "#10b981",
        timer: 2000,
        showConfirmButton: false,
      });
      router.push("/maintenance");
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Terjadi kesalahan. Silakan coba lagi." });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="id" value={aset.id} />

      {/* Info aset — read-only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>ID Aset</Label>
          <Input value={aset.id} readOnly className="bg-muted/40 font-heading text-xs" />
        </div>
        <div className="grid gap-1.5">
          <Label>Nama Aset</Label>
          <Input value={aset.nama} readOnly className="bg-muted/40" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Lokasi</Label>
          <Input
            value={`${aset.lokasiGedung} — Lantai ${aset.lokasiLantai}`}
            readOnly
            className="bg-muted/40 text-xs"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Kategori</Label>
          <Input
            value={`${aset.kategori} / ${aset.subKategori}`}
            readOnly
            className="bg-muted/40 text-xs"
          />
        </div>
      </div>

      {/* Detail perbaikan */}
      <div className="border-t pt-5 space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Detail Perbaikan
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="tanggalPengerjaan">
              Tanggal Pengerjaan <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tanggalPengerjaan"
              name="tanggalPengerjaan"
              type="date"
              defaultValue={today}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tanggalSelesai">
              Tanggal Selesai <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tanggalSelesai"
              name="tanggalSelesai"
              type="date"
              defaultValue={today}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="jenisKerusakan">
              Jenis Kerusakan <span className="text-destructive">*</span>
            </Label>
            <Input
              id="jenisKerusakan"
              name="jenisKerusakan"
              list="kerusakan-list"
              placeholder="Contoh: Seal Bocor, PCB Error..."
              required
            />
            <datalist id="kerusakan-list">
              {uniqueKerusakan.map((k, i) => <option key={i} value={k} />)}
            </datalist>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="severity">
              Severity <span className="text-destructive">*</span>
            </Label>
            <select
              id="severity"
              name="severity"
              defaultValue=""
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>Pilih severity...</option>
              <option value="Ringan">Ringan</option>
              <option value="Sedang">Sedang</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Fatal">Fatal</option>
            </select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="penyebab">
            Root Cause / Penyebab <span className="text-destructive">*</span>
          </Label>
          <Input
            id="penyebab"
            name="penyebab"
            list="penyebab-list"
            placeholder="Deskripsikan akar penyebab kerusakan..."
            required
          />
          <datalist id="penyebab-list">
            {uniquePenyebab.map((p, i) => <option key={i} value={p} />)}
          </datalist>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>Biaya Perbaikan (Rp)</Label>
            <Input
              type="text"
              placeholder="0"
              value={displayBiaya}
              onChange={handleBiayaChange}
            />
            <input type="hidden" name="biayaPerbaikan" value={rawBiaya} />
          </div>
          <div className="grid gap-1.5">
            <Label>Spare Part Digunakan</Label>
            <Input
              name="sparePartDigunakan"
              list="sparepart-list"
              placeholder="Contoh: Mechanical seal kit..."
            />
            <datalist id="sparepart-list">
              {uniqueSparepart.map((s, i) => <option key={i} value={s} />)}
            </datalist>
          </div>
        </div>
      </div>

      {/* Kondisi baru aset setelah perbaikan */}
      <div className="border-t pt-5 space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Kondisi Aset Setelah Perbaikan
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="status">
              Status Aset <span className="text-destructive">*</span>
            </Label>
            <select
              id="status"
              name="status"
              defaultValue="Aktif"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Aktif">Aktif</option>
              <option value="Dalam Perbaikan">Dalam Perbaikan</option>
              <option value="Non-Aktif">Non-Aktif</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="healthStatus">
              Health Status <span className="text-destructive">*</span>
            </Label>
            <select
              id="healthStatus"
              name="healthStatus"
              defaultValue={aset.healthStatus}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Healthy">Healthy</option>
              <option value="Watch">Watch</option>
              <option value="Warning">Warning</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="sisaUmurHari">
              Sisa Umur (Hari) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sisaUmurHari"
              name="sisaUmurHari"
              type="number"
              min="0"
              defaultValue={aset.sisaUmurHari}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Estimasi sisa umur setelah perbaikan
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="estimasiPenggantian">
              Estimasi Penggantian <span className="text-destructive">*</span>
            </Label>
            <Input
              id="estimasiPenggantian"
              name="estimasiPenggantian"
              type="date"
              defaultValue={estimasiDefault}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" className="gap-2" disabled={loading}>
          {loading ? (
            "Menyimpan..."
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Simpan Perbaikan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
