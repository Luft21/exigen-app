"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HealthGauge } from "@/components/health-gauge";
import { StatusBadge } from "@/components/status-badge";
import type { MasterAsset } from "@/lib/data";
import { Plus } from "lucide-react";

interface AssetHealthCardProps {
  asset: MasterAsset;
  compact?: boolean;
}

export function AssetHealthCard({ asset, compact = false }: AssetHealthCardProps) {
  // Determine status
  const status = asset.sisaUmurHari <= 30 ? "Critical" : asset.sisaUmurHari <= 90 ? "Warning" : asset.sisaUmurHari <= 180 ? "Watch" : "Healthy";

  return (
    <Card className="animate-fade-in-up overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col gap-4 h-full justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col min-w-0 flex-1">
            {/* Header: ID & Status */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="font-heading text-xs font-bold text-muted-foreground tracking-wider uppercase">
                {asset.id}
              </span>
              <StatusBadge status={status} />
            </div>
            
            {/* Highlight: Asset Type / Name */}
            <h3 className="font-heading text-lg font-extrabold leading-tight text-foreground truncate mb-1" title={asset.tipe}>
              {asset.tipe}
            </h3>
            
            {/* Minor details (very small) */}
            <div className="text-xs text-muted-foreground flex flex-col gap-0.5 mt-1.5 leading-snug">
              <span className="truncate font-semibold text-foreground/80" title={asset.nama}>{asset.nama}</span>
              <span className="truncate" title={`${asset.merek} ${asset.model}`}>{asset.merek} {asset.model}</span>
              <span className="truncate" title={`${asset.kategori} / ${asset.subKategori}`}>{asset.kategori} / {asset.subKategori}</span>
              <span className="truncate" title={`${asset.lokasiGedung}, Lt. ${asset.lokasiLantai}, Zona ${asset.lokasiZona}`}>
                {asset.lokasiGedung}, Lt. {asset.lokasiLantai}, Zona {asset.lokasiZona}
              </span>
            </div>
          </div>

          {/* Gauge (Big Circle) */}
          <div className="shrink-0 -mt-1 -mr-1">
            <HealthGauge
              sisaUmurHari={asset.sisaUmurHari}
              status={status}
              size={90} 
            />
          </div>
        </div>

        {/* Footer Button */}
        <Button size="sm" variant="default" className="w-full h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm mt-1" asChild>
          <Link href={`/input-servis?idAset=${asset.id}`} className="flex items-center justify-center">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Buat Tiket Perbaikan
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
