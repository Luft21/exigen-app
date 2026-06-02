"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import type { MasterAsset } from "@/lib/data";
import { MapPin, Plus, Tag } from "lucide-react";
import Link from "next/link";

export function AssetCriticalCard({ asset }: { asset: MasterAsset }) {
  return (
    <div className="flex flex-col p-4 rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow h-full">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="font-heading text-sm font-bold text-foreground line-clamp-2 leading-tight">
          {asset.nama}
        </span>
        <div className="shrink-0">
          <StatusBadge status={asset.sisaUmurHari <= 30 ? "Critical" : asset.sisaUmurHari <= 90 ? "Warning" : asset.sisaUmurHari <= 180 ? "Watch" : "Healthy"} />
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mb-4 flex-1">
        <span className="font-medium text-slate-500 bg-muted/50 px-2 py-0.5 rounded w-fit">ID: {asset.id}</span>
        <span className="flex items-center gap-1.5 mt-1">
          <Tag className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{asset.kategori}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{asset.lokasiGedung}, Lt.{asset.lokasiLantai}</span>
        </span>
      </div>
      
      <div className="flex flex-col gap-3 mt-auto pt-3 border-t border-border/50">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Sisa Umur</span>
          <span className={`font-heading font-bold text-sm ${asset.sisaUmurHari <= 30 ? "text-destructive" : "text-warning"}`}>
            {asset.sisaUmurHari} Hari
          </span>
        </div>
        <Button size="sm" variant="default" className="h-8 w-full text-xs bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
          <Link href={`/input-servis?idAset=${asset.id}`}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Buat Tiket
          </Link>
        </Button>
      </div>
    </div>
  );
}
