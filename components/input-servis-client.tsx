"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { FileText, CheckCircle2, RotateCcw, Database, Calendar, AlertCircle, Wrench, User } from "lucide-react";
import { buatDataServisHistory } from "@/app/actions/ticket";
import Swal from "sweetalert2";
import { useSession } from "next-auth/react";

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

function SuggestionInput({
  id,
  name,
  placeholder,
  value,
  onChange,
  suggestions,
  required = false,
}: {
  id?: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanSuggestions = Array.from(new Set(suggestions.filter(Boolean)));
  const filtered = cleanSuggestions.filter((item) =>
    item.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        required={required}
        autoComplete="off"
        className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 bg-background"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in duration-100 divide-y divide-border/40">
          {filtered.map((item, index) => (
            <li key={index}>
              <button
                type="button"
                className="flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => {
                  onChange(item);
                  setIsOpen(false);
                }}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InputServisForm({
  assets,
  uniqueKerusakan,
  uniquePenyebab,
  uniqueSparepart,
}: {
  assets: any[];
  uniqueKerusakan: string[];
  uniquePenyebab: string[];
  uniqueSparepart: string[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idAsetQuery = searchParams.get("idAset");



  const { data: session } = useSession();
  const userName = session?.user?.nama ?? session?.user?.username ?? "Teknisi";

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [displayBiaya, setDisplayBiaya] = useState("");
  const [rawBiaya, setRawBiaya] = useState("0");
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (idAsetQuery) {
      handleAssetChange(idAsetQuery);
    }
  }, [idAsetQuery]);

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleBiayaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setRawBiaya(digits || "0");
    setDisplayBiaya(digits ? Number(digits).toLocaleString("en-US") : "");
    handleChange("biayaPerbaikan", digits);
  };

  const handleAssetChange = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (asset) {
      setForm((prev: any) => ({
        ...prev,
        idAset: asset.id,
        namaAset: asset.nama,
        kategori: asset.kategori,
        subKategori: asset.subKategori,
        tipe: asset.tipe,
      }));
    }
  };

  const validateDates = (p: string, w: string, f: string) => {
    if (!p || !w || !f) {
      setDateError(null);
      return;
    }
    const pDate = new Date(p);
    const wDate = new Date(w);
    const fDate = new Date(f);

    if (isNaN(pDate.getTime()) || isNaN(wDate.getTime()) || isNaN(fDate.getTime())) {
      setDateError("Format tanggal tidak valid.");
      return;
    }

    pDate.setHours(0, 0, 0, 0);
    wDate.setHours(0, 0, 0, 0);
    fDate.setHours(0, 0, 0, 0);

    if (wDate.getTime() < pDate.getTime()) {
      setDateError("Peringatan: Tanggal Pengerjaan tidak boleh mundur dari Tanggal Perencanaan.");
    } else if (fDate.getTime() < pDate.getTime()) {
      setDateError("Peringatan: Tanggal Selesai tidak boleh mundur dari Tanggal Perencanaan.");
    } else if (fDate.getTime() < wDate.getTime()) {
      setDateError("Peringatan: Tanggal Selesai tidak boleh mundur dari Tanggal Pengerjaan (Perbaikan).");
    } else {
      setDateError(null);
    }
  };

  const handleDateChange = (field: string, val: string) => {
    handleChange(field, val);
    const updatedForm = { ...form, [field]: val };
    validateDates(
      updatedForm.tanggalPerencanaan,
      updatedForm.tanggalPengerjaan,
      updatedForm.tanggalSelesai
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (dateError) {
      Swal.fire({
        icon: "error",
        title: "Tanggal Tidak Valid",
        text: dateError,
      });
      return;
    }
    setSubmitted(true);
    try {
      const pDate = new Date(form.tanggalPerencanaan);
      const wDate = new Date(form.tanggalPengerjaan);
      const fDate = new Date(form.tanggalSelesai);

      if (isNaN(pDate.getTime()) || isNaN(wDate.getTime()) || isNaN(fDate.getTime())) {
        Swal.fire({
          icon: "error",
          title: "Tanggal Tidak Valid",
          text: "Harap masukkan tanggal yang valid.",
        });
        setSubmitted(false);
        return;
      }

      pDate.setHours(0, 0, 0, 0);
      wDate.setHours(0, 0, 0, 0);
      fDate.setHours(0, 0, 0, 0);

      if (wDate.getTime() < pDate.getTime()) {
        Swal.fire({
          icon: "error",
          title: "Tanggal Tidak Valid",
          text: "Tanggal Pengerjaan (Perbaikan) tidak boleh mundur dari Tanggal Perencanaan.",
        });
        setSubmitted(false);
        return;
      }

      if (fDate.getTime() < pDate.getTime()) {
        Swal.fire({
          icon: "error",
          title: "Tanggal Tidak Valid",
          text: "Tanggal Selesai tidak boleh mundur dari Tanggal Perencanaan.",
        });
        setSubmitted(false);
        return;
      }

      if (fDate.getTime() < wDate.getTime()) {
        Swal.fire({
          icon: "error",
          title: "Tanggal Tidak Valid",
          text: "Tanggal Selesai tidak boleh mundur dari Tanggal Pengerjaan (Perbaikan).",
        });
        setSubmitted(false);
        return;
      }

      const formData = new FormData(e.currentTarget);
      formData.set("idAset", form.idAset);
      formData.set("namaAset", form.namaAset);
      formData.set("kategori", form.kategori);
      formData.set("subKategori", form.subKategori);
      formData.set("tipe", form.tipe);
      formData.set("severity", form.severity);
      formData.set("biayaPerbaikan", rawBiaya);
      formData.set("teknisiPelaksana", userName);

      await buatDataServisHistory(formData);
      
      Swal.fire({
        icon: "success",
        title: "Tersimpan!",
        text: "Data servis historis berhasil ditambahkan ke sistem.",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        router.push("/aset");
        router.refresh();
      });

      handleReset();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan saat menyimpan data.",
      });
    } finally {
      setSubmitted(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setSubmitted(false);
    setDisplayBiaya("");
    setRawBiaya("0");
    setDateError(null);
  };

  return (
    <Card className="animate-fade-in-up bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-xl overflow-hidden">
      <CardHeader className="pb-3 pt-6 px-6">
        <CardTitle className="font-mono text-xs tracking-wider flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold uppercase">
          <FileText className="h-4.5 w-4.5 text-slate-500" />
          Form Input Servis Aset
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Pemilihan & Info Aset */}
          <div className="bg-slate-50/50 dark:bg-slate-800/10 rounded-xl p-5 border border-slate-100 dark:border-slate-800/60 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="idAset" className="font-mono text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  ID ASET
                </Label>
                <div className="mt-1.5">
                  {idAsetQuery ? (
                    <Input id="idAset" value={form.idAset} readOnly className="bg-muted/40 font-semibold text-sm max-w-md" />
                  ) : (
                    <Select
                      value={form.idAset}
                      onValueChange={handleAssetChange}
                      required
                    >
                      <SelectTrigger id="idAset" className="max-w-md bg-background border-border hover:bg-muted/50 transition-colors">
                        <SelectValue placeholder="Pilih ID Aset..." />
                      </SelectTrigger>
                      <SelectContent>
                        {assets.map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.id} — {a.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            {form.idAset && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 animate-fade-in-up">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">NAMA ASET</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{form.namaAset}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">TIPE ASET</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{form.tipe}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">KATEGORI</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{form.kategori}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">SUB KATEGORI</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{form.subKategori}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Penjadwalan & Waktu */}
          <div className="space-y-4 pt-2">
            <hr className="border-t border-slate-100 dark:border-slate-800" />
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
              <Calendar className="h-4.5 w-4.5 text-slate-500" />
              <span>Jadwal & Waktu Perbaikan</span>
            </div>
            
            {dateError && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-600 dark:text-amber-400 font-medium animate-fade-in-up">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <span>{dateError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="tglPerencanaan" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tanggal Perencanaan</Label>
                <Input
                  id="tglPerencanaan"
                  name="tanggalPerencanaan"
                  type="date"
                  value={form.tanggalPerencanaan}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDateChange("tanggalPerencanaan", e.target.value)
                  }
                  required
                  className="bg-background border-border hover:bg-muted/20 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tglPengerjaan" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tanggal Pengerjaan (Perbaikan)</Label>
                <Input
                  id="tglPengerjaan"
                  name="tanggalPengerjaan"
                  type="date"
                  value={form.tanggalPengerjaan}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDateChange("tanggalPengerjaan", e.target.value)
                  }
                  required
                  className="bg-background border-border hover:bg-muted/20 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tglSelesai" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tanggal Selesai</Label>
                <Input
                  id="tglSelesai"
                  name="tanggalSelesai"
                  type="date"
                  value={form.tanggalSelesai}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDateChange("tanggalSelesai", e.target.value)
                  }
                  required
                  className="bg-background border-border hover:bg-muted/20 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Masalah & Diagnosis */}
          <div className="space-y-4 pt-2">
            <hr className="border-t border-slate-100 dark:border-slate-800" />
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
              <AlertCircle className="h-4.5 w-4.5 text-slate-500" />
              <span>Laporan & Diagnosis Masalah</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-1.5 md:col-span-2">
                <Label htmlFor="keluhan" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Keluhan Awal</Label>
                <Textarea
                  id="keluhan"
                  name="keluhan"
                  placeholder="Deskripsikan keluhan atau laporan kerusakan dari user..."
                  value={form.keluhan}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleChange("keluhan", e.target.value)
                  }
                  required
                  className="min-h-[80px] bg-background border-border hover:bg-muted/10 transition-colors"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="severity" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Severity</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v: string) => handleChange("severity", v)}
                  required
                >
                  <SelectTrigger id="severity" className="bg-background border-border hover:bg-muted/50 transition-all w-fit min-w-[140px] px-3 py-2 rounded-lg">
                    <SelectValue placeholder="Pilih severity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((s) => {
                      let dotColor = "bg-green-500";
                      if (s === "Sedang") dotColor = "bg-yellow-500";
                      else if (s === "Berat" || s === "Tinggi") dotColor = "bg-orange-500";
                      else if (s === "Kritis" || s === "Fatal") dotColor = "bg-red-500";
                      return (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                            <span>{s}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="jenisKerusakan" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Diagnosis (Jenis Kerusakan)</Label>
                <SuggestionInput
                  id="jenisKerusakan"
                  name="jenisKerusakan"
                  placeholder="Ketik atau pilih jenis kerusakan..."
                  value={form.jenisKerusakan}
                  onChange={(val) => handleChange("jenisKerusakan", val)}
                  suggestions={uniqueKerusakan}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="penyebab" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Akar Penyebab (Root Cause)</Label>
                <SuggestionInput
                  id="penyebab"
                  name="penyebab"
                  placeholder="Ketik atau pilih penyebab kerusakan..."
                  value={form.penyebab}
                  onChange={(val) => handleChange("penyebab", val)}
                  suggestions={uniquePenyebab}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 4: Penyelesaian & Suku Cadang */}
          <div className="space-y-4 pt-2">
            <hr className="border-t border-slate-100 dark:border-slate-800" />
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
              <Wrench className="h-4.5 w-4.5 text-slate-500" />
              <span>Penyelesaian & Suku Cadang</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="sparePart" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Spare Part Digunakan</Label>
                <SuggestionInput
                  id="sparePart"
                  name="sparePartDigunakan"
                  placeholder="Contoh: Mechanical seal kit..."
                  value={form.sparePartDigunakan}
                  onChange={(val) => handleChange("sparePartDigunakan", val)}
                  suggestions={uniqueSparepart}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="biaya" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Biaya Perbaikan (Rp)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                  <Input
                    id="biaya"
                    type="text"
                    placeholder="0"
                    value={displayBiaya}
                    onChange={handleBiayaChange}
                    required
                    className="pl-9 font-medium bg-background border-border text-left"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="teknisi" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Teknisi Pelaksana</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="teknisi"
                    name="teknisiPelaksana"
                    value={userName}
                    readOnly
                    className="pl-9 bg-muted/30 font-medium text-slate-600 dark:text-slate-400 border-border cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              className="gap-2 px-6 bg-[#0B192C] hover:bg-[#152C4F] text-white font-medium transition-all rounded-lg"
              disabled={submitted}
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Simpan Data Servis
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 px-5 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all rounded-lg"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              Reset Form
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
  );
}

export default function InputServisClient({
  assets,
  uniqueKerusakan = [],
  uniquePenyebab = [],
  uniqueSparepart = [],
}: {
  assets: any[];
  uniqueKerusakan?: string[];
  uniquePenyebab?: string[];
  uniqueSparepart?: string[];
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Memuat Form...</div>}>
      <InputServisForm
        assets={assets}
        uniqueKerusakan={uniqueKerusakan}
        uniquePenyebab={uniquePenyebab}
        uniqueSparepart={uniqueSparepart}
      />
    </Suspense>
  );
}
