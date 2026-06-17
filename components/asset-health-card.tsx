"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HealthGauge } from "@/components/health-gauge";
import { StatusBadge } from "@/components/status-badge";
import type { MasterAsset } from "@/lib/data";
import { Plus, Tag, MapPin, Cpu } from "lucide-react";

interface AssetHealthCardProps {
  asset: MasterAsset;
  compact?: boolean;
}

export function AssetHealthCard({ asset, compact = false }: AssetHealthCardProps) {
  // Determine status
  const status = asset.sisaUmurHari <= 30 ? "Critical" : asset.sisaUmurHari <= 90 ? "Warning" : asset.sisaUmurHari <= 180 ? "Watch" : "Healthy";

  // Accent and button colors based on severity status
  const theme = {
    Critical: {
      accent: "bg-linear-to-r from-rose-500 to-red-600",
      glow: "shadow-[0_4px_16px_rgba(244,63,94,0.12)] border-rose-500/20",
      btn: "bg-linear-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xs shadow-rose-500/10",
      badgeText: "text-rose-500"
    },
    Warning: {
      accent: "bg-linear-to-r from-amber-500 to-orange-500",
      glow: "shadow-[0_4px_16px_rgba(245,158,11,0.12)] border-amber-500/20",
      btn: "bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs shadow-amber-500/10",
      badgeText: "text-amber-500"
    },
    Watch: {
      accent: "bg-linear-to-r from-cyan-500 to-blue-600",
      glow: "shadow-[0_4px_16px_rgba(6,182,212,0.12)] border-cyan-500/20",
      btn: "bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-xs shadow-cyan-500/10",
      badgeText: "text-cyan-500"
    },
    Healthy: {
      accent: "bg-linear-to-r from-emerald-500 to-green-600",
      glow: "shadow-[0_4px_16px_rgba(16,185,129,0.12)] border-emerald-500/20",
      btn: "bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xs shadow-emerald-500/10",
      badgeText: "text-emerald-500"
    }
  }[status];

  return (
    <Card className={`animate-fade-in-up overflow-hidden border border-slate-200/80 dark:border-slate-800/85 bg-linear-to-b from-card to-slate-50/10 dark:to-slate-950/5 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-y-1.5 ${theme.glow} group`}>
      {/* Dynamic Glow Line */}
      <div className={`h-1 w-full ${theme.accent}`} />
      
      <CardContent className="p-4 flex flex-col gap-4 h-full justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col min-w-0 flex-1">
            {/* Header: ID & Status */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase bg-slate-100/70 dark:bg-slate-800/70 px-1.5 py-0.5 rounded-sm">
                {asset.id}
              </span>
              <StatusBadge status={status} />
            </div>
            
            {/* Highlight: Asset Type / Name */}
            <h3 className="font-heading text-[15px] font-extrabold leading-snug text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors" title={asset.tipe}>
              {asset.tipe}
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate leading-none mt-1" title={asset.nama}>
              {asset.nama}
            </span>
            
            {/* Minor details with custom icons */}
            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex flex-col gap-1.5 mt-3.5 leading-none">
              <span className="truncate flex items-center gap-1.5" title={`${asset.merek} ${asset.model || '-'}`}>
                <Cpu className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
                <span className="truncate font-medium">{asset.merek} &middot; {asset.model || "-"}</span>
              </span>
              <span className="truncate flex items-center gap-1.5" title={`${asset.kategori} / ${asset.subKategori}`}>
                <Tag className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
                <span className="truncate">{asset.kategori} &middot; {asset.subKategori}</span>
              </span>
              <span className="truncate flex items-center gap-1.5" title={`${asset.lokasiGedung}, Lt. ${asset.lokasiLantai}, Zona ${asset.lokasiZona}`}>
                <MapPin className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
                <span className="truncate">{asset.lokasiGedung}, Lt. {asset.lokasiLantai}, Z. {asset.lokasiZona}</span>
              </span>
            </div>
          </div>

          {/* Gauge (Big Circle) */}
          <div className="shrink-0 -mt-1 -mr-1 transition-transform group-hover:scale-105 duration-300">
            <HealthGauge
              sisaUmurHari={asset.sisaUmurHari}
              status={status}
              size={85} 
            />
          </div>
        </div>

        {/* Footer Button with dynamic severity matching style */}
        <Button size="sm" className={`w-full h-8 text-[11px] font-extrabold shadow-sm mt-2 cursor-pointer transition-all duration-300 transform active:scale-[0.98] ${theme.btn}`} asChild>
          <Link href={`/input-servis?idAset=${asset.id}`} className="flex items-center justify-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Buat Tiket Perbaikan
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
