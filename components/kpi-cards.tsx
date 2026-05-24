"use client";

import { Card, CardContent } from "@/components/ui/card";

import { Box, AlertTriangle, Clock } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  accent?: string;
  delay?: number;
}

function KPICard({ title, value, subtitle, icon, accent, delay = 0 }: KPICardProps) {
  return (
    <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {title}
            </span>
            <span className={`font-heading text-2xl font-bold tracking-tight ${accent || "text-foreground"}`}>
              {value}
            </span>
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KPICards({ data }: { data: { totalAset: number, asetKritis: number, rataRata: number } }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KPICard
        title="Total Aset"
        value={data.totalAset}
        subtitle="Aset terdaftar"
        icon={<Box className="h-5 w-5" />}
        delay={0}
      />
      <KPICard
        title="Aset Kritis"
        value={data.asetKritis}
        subtitle="Sisa umur ≤ 30 hari"
        icon={<AlertTriangle className="h-5 w-5" />}
        accent="text-destructive"
        delay={100}
      />
      <KPICard
        title="Rata-rata Sisa Umur"
        value={`${data.rataRata} hari`}
        subtitle="Semua aset aktif"
        icon={<Clock className="h-5 w-5" />}
        delay={200}
      />

    </div>
  );
}
