"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HealthGauge } from "@/components/health-gauge";
import { StatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import type { MasterAsset, AssetComplaint } from "@/lib/data";
import { assetComplaints, formatDate, formatRupiah } from "@/lib/data";
import {
  MapPin,
  Calendar,
  Tag,
  AlertCircle,
} from "lucide-react";

interface AssetHealthCardProps {
  asset: MasterAsset;
}

export function AssetHealthCard({ asset }: AssetHealthCardProps) {
  const complaints = assetComplaints
    .filter((c) => c.idAset === asset.id)
    .sort((a, b) => new Date(b.tanggalSelesai).getTime() - new Date(a.tanggalSelesai).getTime());

  return (
    <Card className="animate-fade-in-up overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading text-xs text-muted-foreground tracking-wider">
                {asset.id}
              </span>
              <StatusBadge status={asset.healthStatus} />
            </div>
            <CardTitle className="font-heading text-lg font-bold leading-tight truncate">
              {asset.nama}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {asset.kategori} / {asset.subKategori} / {asset.tipe}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {asset.lokasiGedung}, {asset.lokasiLantai}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Gauge */}
          <div className="flex flex-col items-center gap-2">
            <HealthGauge
              sisaUmurHari={asset.sisaUmurHari}
              status={asset.healthStatus}
              size={130}
            />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Estimasi Penggantian
              </p>
              <p className="font-heading text-xs font-semibold flex items-center gap-1 justify-center mt-0.5">
                <Calendar className="h-3 w-3" />
                {formatDate(asset.estimasiPenggantian)}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div className="flex flex-col border-l-2 border-primary/20 pl-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Merek / Model
                </span>
                <span className="font-medium text-xs mt-0.5 text-foreground/90">
                  {asset.merek} {asset.model}
                </span>
              </div>
              <div className="flex flex-col border-l-2 border-primary/20 pl-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Tanggal Instalasi
                </span>
                <span className="font-medium text-xs mt-0.5 text-foreground/90">
                  {formatDate(asset.tanggalInstalasi)}
                </span>
              </div>
              <div className="flex flex-col border-l-2 border-primary/20 pl-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Tingkat Kekritisan
                </span>
                <span className="font-medium text-xs mt-0.5 text-foreground/90">
                  {asset.tingkatKekritisan}
                </span>
              </div>
              <div className="flex flex-col border-l-2 border-primary/20 pl-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Zona
                </span>
                <span className="font-medium text-xs mt-0.5 text-foreground/90">
                  {asset.lokasiZona}
                </span>
              </div>
            </div>

            {/* Mini Timeline */}
            {complaints.length > 0 && (
              <div className="mt-4">
                <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Riwayat Servis Terakhir
                </h4>
                <div className="space-y-2">
                  {complaints.slice(0, 3).map((c: AssetComplaint) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-md border border-border/50 bg-card p-2 text-xs"
                    >
                      <div className="h-8 w-0.5 rounded-full bg-accent-custom shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {c.jenisKerusakan}
                          </span>
                          <SeverityBadge severity={c.severity} className="text-[9px]" />
                        </div>
                        <span className="text-muted-foreground text-[10px]">
                          {formatDate(c.tanggalSelesai)} · {formatRupiah(c.biayaPerbaikan)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
