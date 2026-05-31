"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { masterAssets } from "@/lib/data";
import { Save, CheckCircle2, RotateCcw, Database } from "lucide-react";

const severityOptions = ["Ringan", "Sedang", "Berat", "Kritis"];

const initialForm = {
  idAset: "",
  namaAset: "",
  kategori: "",
  subKategori: "",
  tipe: "",
  tanggalPerencanaan: "",
  tanggalPengerjaan: "",
  tanggalSelesai: "",
  keluhan: "",
  jenisKerusakan: "",
  severity: "",
  penyebab: "",
  biayaPerbaikan: "",
  sparePartDigunakan: "",
  teknisiPelaksana: "",
};

export default function InputServisPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(initialForm);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssetChange = (assetId: string) => {
    const asset = masterAssets.find((a) => a.id === assetId);
    if (asset) {
      setForm((prev) => ({
        ...prev,
        idAset: asset.id,
        namaAset: asset.nama,
        kategori: asset.kategori,
        subKategori: asset.subKategori,
        tipe: asset.tipe,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleReset = () => {
    setForm(initialForm);
    setSubmitted(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">
          Input Data Servis
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Input data perbaikan aset terbaru untuk memperkaya dataset model
          prediksi.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 animate-fade-in-up">
        <Database className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Data untuk Retraining Model ML
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Setiap data servis yang diinput akan digunakan model Random Forest
            Regressor untuk belajar pola kerusakan terbaru dan memperbaiki
            akurasi prediksi sisa umur aset.
          </p>
        </div>
      </div>

      <Card className="animate-fade-in-up overflow-hidden">
        <CardHeader>
          <CardTitle className="font-heading text-sm flex items-center gap-2">
            <Save className="h-4 w-4" />
            Form Input Servis Aset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: ID Aset & Nama Aset */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="idAset">ID Aset</Label>
                <Select
                  value={form.idAset}
                  onValueChange={handleAssetChange}
                  required
                >
                  <SelectTrigger id="idAset">
                    <SelectValue placeholder="Pilih ID Aset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {masterAssets.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.id} — {a.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipe">Tipe Aset</Label>
                <Input
                  id="tipe"
                  placeholder="Otomatis terisi saat memilih ID Aset"
                  value={form.tipe}
                  readOnly
                  className="bg-muted/40 font-medium"
                />
              </div>
            </div>

            {/* Row 2: Kategori, Sub Kategori, Tipe */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="namaAset">Nama Aset</Label>
                <Input
                  value={form.namaAset}
                  readOnly
                  className="bg-muted/40 text-xs"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kategori">Kategori</Label>
                <Input
                  id="kategori"
                  placeholder="—"
                  value={form.kategori}
                  readOnly
                  className="bg-muted/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subKategori">Sub Kategori</Label>
                <Input
                  id="subKategori"
                  placeholder="—"
                  value={form.subKategori}
                  readOnly
                  className="bg-muted/40"
                />
              </div>
            </div>

            {/* Row 3: Tanggal Perencanaan, Pengerjaan, Selesai */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tglPerencanaan">Tanggal Perencanaan</Label>
                <Input
                  id="tglPerencanaan"
                  type="date"
                  value={form.tanggalPerencanaan}
                  onChange={(e) =>
                    handleChange("tanggalPerencanaan", e.target.value)
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tglPengerjaan">Tanggal Pengerjaan</Label>
                <Input
                  id="tglPengerjaan"
                  type="date"
                  value={form.tanggalPengerjaan}
                  onChange={(e) =>
                    handleChange("tanggalPengerjaan", e.target.value)
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tglSelesai">Tanggal Selesai</Label>
                <Input
                  id="tglSelesai"
                  type="date"
                  value={form.tanggalSelesai}
                  onChange={(e) =>
                    handleChange("tanggalSelesai", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            {/* Row 4: Keluhan & Jenis Kerusakan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="keluhan">Keluhan Awal</Label>
                <Textarea
                  id="keluhan"
                  placeholder="Contoh: AC bocor netes air..."
                  value={form.keluhan}
                  onChange={(e) =>
                    handleChange("keluhan", e.target.value)
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jenisKerusakan">Diagnosis (Jenis Kerusakan)</Label>
                <Textarea
                  id="jenisKerusakan"
                  placeholder="Contoh: Seal Bocor, Evaporator Kotor..."
                  value={form.jenisKerusakan}
                  onChange={(e) =>
                    handleChange("jenisKerusakan", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            {/* Row 4.5: Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v) => handleChange("severity", v)}
                  required
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Pilih severity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 5: Penyebab */}
            <div className="grid gap-2">
              <Label htmlFor="penyebab">Penyebab</Label>
              <Textarea
                id="penyebab"
                placeholder="Deskripsikan penyebab kerusakan..."
                className="min-h-[80px]"
                value={form.penyebab}
                onChange={(e) => handleChange("penyebab", e.target.value)}
                required
              />
            </div>

            {/* Row 6: Biaya Perbaikan & Spare Part */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="biaya">Biaya Perbaikan (Rp)</Label>
                <Input
                  id="biaya"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.biayaPerbaikan}
                  onChange={(e) =>
                    handleChange("biayaPerbaikan", e.target.value)
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sparePart">Spare Part Digunakan</Label>
                <Input
                  id="sparePart"
                  placeholder="Contoh: Mechanical seal kit..."
                  value={form.sparePartDigunakan}
                  onChange={(e) =>
                    handleChange("sparePartDigunakan", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Row 7: Teknisi Pelaksana */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="teknisi">Teknisi Pelaksana</Label>
                <Input
                  id="teknisi"
                  placeholder="Nama teknisi pelaksana..."
                  value={form.teknisiPelaksana}
                  onChange={(e) =>
                    handleChange("teknisiPelaksana", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" className="gap-2" disabled={submitted}>
                {submitted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Data Tersimpan!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Data Servis
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              {submitted && (
                <Badge
                  variant="outline"
                  className="bg-success/15 text-success border-success/30 animate-fade-in-up"
                >
                  Data siap untuk retraining model
                </Badge>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
