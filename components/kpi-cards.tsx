"use client";

import { Card, CardContent } from "@/components/ui/card";

import { AlertTriangle, Clock, Wrench, RefreshCw, Inbox, CheckCircle2 } from "lucide-react";

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
    <Card className="animate-fade-in-up overflow-hidden bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 shadow-none hover:bg-slate-100/70 transition-colors" style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="p-2 sm:p-3 flex items-center gap-3 sm:gap-4 h-full">
        <div className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm border border-border/50 ${accent || "text-primary"}`}>
          {icon}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold truncate pr-2">
              {title}
            </span>
            <span className="text-[9px] font-medium text-slate-400/80 truncate hidden xl:block">{subtitle}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`font-heading text-lg sm:text-xl font-extrabold tracking-tight leading-none ${accent || "text-foreground"}`}>
              {value}
            </span>
            <span className="text-[10px] font-medium text-slate-500/70 truncate xl:hidden">{subtitle}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KPICards({ data, className }: { data: { asetGanti: number, tiketMasuk: number, rataRata: number, asetMaintenance: number, kepatuhan: number }, className?: string }) {
  return (
    <div className={`grid gap-3 sm:gap-4 ${className || "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"}`}>
      <KPICard
        title="Penggantian Tertunda"
        value={data.asetGanti}
        subtitle="Sisa umur 0 hari"
        icon={<RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />}
        accent="text-destructive"
        delay={0}
      />
      <KPICard
        title="Maintenance"
        value={data.asetMaintenance}
        subtitle="Sedang diperbaiki"
        icon={<Wrench className="h-4 w-4 sm:h-5 sm:w-5" />}
        accent="text-blue-600 dark:text-blue-400"
        delay={100}
      />
      <KPICard
        title="Tiket Masuk"
        value={data.tiketMasuk}
        subtitle="Staging tiket NLP"
        icon={<Inbox className="h-4 w-4 sm:h-5 sm:w-5" />}
        accent="text-blue-600 dark:text-blue-400"
        delay={200}
      />
      <KPICard
        title="Rata-rata sisa umur"
        value={`${data.rataRata.toLocaleString("id-ID")} hr`}
        subtitle="Rata-rata umur aset"
        icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
        accent="text-emerald-600 dark:text-emerald-400"
        delay={300}
      />
      <KPICard
        title="Kepatuhan Servis"
        value={`${data.kepatuhan}%`}
        subtitle="Jadwal vs aktual"
        icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />}
        accent="text-emerald-600 dark:text-emerald-400"
        delay={400}
      />
    </div>
  );
}
