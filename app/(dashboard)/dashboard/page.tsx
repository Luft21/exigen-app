import { KPICards } from "@/components/kpi-cards";
import { AssetHealthCard } from "@/components/asset-health-card";
import { CostTrendChart, HeatmapGedungLantai, CategoryRULBarChart } from "@/components/charts";
import { GlobalFilter } from "@/components/global-filter";
import { Sparkline } from "@/components/sparkline";
import { Card, CardContent } from "@/components/ui/card";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Overview",
  description: "Dashboard overview prediksi umur aset dan early warning system.",
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function OverviewPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const period = resolvedParams?.period as string || "all";

  let dateFilter: any = {};
  if (period !== "all") {
    const now = new Date();
    let cutoff = new Date();
    
    if (period === "week") cutoff.setDate(now.getDate() - 7);
    else if (period === "month") cutoff.setDate(now.getDate() - 30);
    else if (period === "3month") cutoff.setDate(now.getDate() - 90);
    else if (period === "6month") cutoff.setDate(now.getDate() - 180);
    else if (period === "year") cutoff.setFullYear(now.getFullYear() - 1);
    
    if (period === "custom") {
      const startParam = resolvedParams?.start as string;
      const endParam = resolvedParams?.end as string;
      
      if (startParam) dateFilter.gte = new Date(startParam);
      if (endParam) dateFilter.lte = new Date(endParam);
    } else {
      dateFilter.gte = cutoff;
    }
  }

  const criticalAssets = await prisma.masterAsset.findMany({
    where: { status: "Aktif" },
    orderBy: { sisaUmurHari: "asc" },
    take: 5,
  });

  const histStart = new Date("2025-07-01"); // Rolling 12 months start
  const histEnd = new Date("2026-06-30"); // Rolling 12 months end

  const [
    asetGanti, 
    avgUmur, 
    maintenanceComplaints, 
    complaintsWithAsset, 
    tiketMasuk,
    distinctPlans,
    finishedComplaints,
    histComplaints,
    histReplacements
  ] = await Promise.all([
    prisma.masterAsset.count({ where: { status: "Aktif", sisaUmurHari: { lte: 0 } } }),
    prisma.masterAsset.aggregate({
      where: { status: "Aktif" },
      _avg: { sisaUmurHari: true }
    }),
    prisma.assetComplaint.findMany({
      where: {
        statusTiket: {
          in: ["MENUNGGU_TEKNISI", "PROSES_SERVIS", "MENUNGGU_APPROVAL_GANTI"]
        },
        ...(period !== "all" && { tanggalPerencanaan: dateFilter })
      },
      select: { idAset: true }
    }),
    prisma.assetComplaint.findMany({
      where: {
        ...(period !== "all" && { tanggalPerencanaan: dateFilter })
      },
      select: {
        tanggalPerencanaan: true,
        asset: {
          select: {
            lokasiGedung: true
          }
        }
      }
    }),
    prisma.komplainPerbaikan.count({ 
      where: { 
        statusStaging: { in: ["OPEN", "DRAFT"] },
        ...(period !== "all" && { tanggalDibuat: dateFilter })
      } 
    }),
    prisma.frequencyPlan.findMany({
      distinct: ['kategori', 'subKategori', 'tipe']
    }),
    prisma.assetComplaint.findMany({
      where: { statusTiket: "SELESAI", NOT: { idAset: null } },
      select: {
        idAset: true,
        tanggalSelesai: true,
        asset: {
          select: {
            kategori: true,
            subKategori: true,
            tipe: true
          }
        }
      },
      orderBy: { tanggalSelesai: 'asc' }
    }),
    prisma.assetComplaint.findMany({
      where: {
        statusTiket: "SELESAI",
        tanggalSelesai: { gte: histStart, lte: histEnd }
      },
      select: { tanggalSelesai: true, biayaPerbaikan: true }
    }),
    prisma.replacementHistory.findMany({
      where: {
        tanggalPenggantian: { gte: histStart, lte: histEnd }
      },
      select: { tanggalPenggantian: true, biayaPenggantian: true }
    })
  ]);

  const maintenanceAsetIds = new Set(maintenanceComplaints.map(c => c.idAset).filter(Boolean));
  const asetMaintenance = maintenanceAsetIds.size;

  // 1. Fetch active assets with extended details for spatial & category aggregation
  const allActiveAssets = await prisma.masterAsset.findMany({
    where: { status: "Aktif" },
    select: {
      sisaUmurHari: true,
      lokasiGedung: true,
      lokasiLantai: true,
      kategori: true
    }
  });

  // Calculate RUL buckets
  const buckets = { kritis: 0, perhatian: 0, monitor: 0, sehat: 0 };
  allActiveAssets.forEach(a => {
    const rul = a.sisaUmurHari || 0;
    if (rul < 7) buckets.kritis++;
    else if (rul <= 30) buckets.perhatian++;
    else if (rul <= 90) buckets.monitor++;
    else buckets.sehat++;
  });

  // 2. Spatial Heatmap Data
  const spatialMap: Record<string, { lokasiGedung: string, lokasiLantai: string, total: number, critical: number }> = {};
  allActiveAssets.forEach(a => {
    const key = `${a.lokasiGedung}|${a.lokasiLantai}`;
    if (!spatialMap[key]) {
      spatialMap[key] = { lokasiGedung: a.lokasiGedung, lokasiLantai: a.lokasiLantai, total: 0, critical: 0 };
    }
    spatialMap[key].total++;
    if (a.sisaUmurHari < 7) {
      spatialMap[key].critical++;
    }
  });
  const heatmapData = Object.values(spatialMap);

  // 3. Category Stacked Bar Data
  const categoryMap: Record<string, { kategori: string, kritis: number, perhatian: number, monitor: number, sehat: number, total: number }> = {};
  allActiveAssets.forEach(a => {
    const cat = a.kategori || "Lainnya";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { kategori: cat, kritis: 0, perhatian: 0, monitor: 0, sehat: 0, total: 0 };
    }
    categoryMap[cat].total++;
    const rul = a.sisaUmurHari || 0;
    if (rul < 7) categoryMap[cat].kritis++;
    else if (rul <= 30) categoryMap[cat].perhatian++;
    else if (rul <= 90) categoryMap[cat].monitor++;
    else categoryMap[cat].sehat++;
  });
  const categoryData = Object.values(categoryMap);

  // 4. Compliance Rate Calculation (Jadwal vs Aktual)
  const freqMapDays: Record<string, number> = {
    'Harian': 1,
    'Mingguan': 7,
    'Bulanan': 30,
    'Tiga Bulanan': 90,
    'Semester': 180,
    'Tahunan': 365,
    'Reaktif': 365
  };

  const planCache: Record<string, number> = {};
  distinctPlans.forEach(p => {
    const key = `${p.kategori}|${p.subKategori}|${p.tipe}`;
    planCache[key] = freqMapDays[p.frekuensi] || 30;
  });

  const complaintsByAsset: Record<string, typeof finishedComplaints> = {};
  finishedComplaints.forEach(c => {
    if (!c.idAset) return;
    if (!complaintsByAsset[c.idAset]) {
      complaintsByAsset[c.idAset] = [];
    }
    complaintsByAsset[c.idAset].push(c);
  });

  let totalIntervals = 0;
  let compliantIntervals = 0;

  Object.entries(complaintsByAsset).forEach(([_, list]) => {
    if (list.length < 2) return;

    const sample = list[0];
    if (!sample.asset) return;
    const key = `${sample.asset.kategori}|${sample.asset.subKategori}|${sample.asset.tipe}`;
    const targetIntervalDays = planCache[key] || 30;

    for (let i = 1; i < list.length; i++) {
      const prevDate = new Date(list[i-1].tanggalSelesai!);
      const currDate = new Date(list[i].tanggalSelesai!);
      
      if (period !== "all") {
        if (dateFilter.gte && currDate < dateFilter.gte) continue;
        if (dateFilter.lte && currDate > dateFilter.lte) continue;
      }

      const diffMs = currDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      totalIntervals++;
      const tolerance = targetIntervalDays * 0.2;
      if (diffDays <= (targetIntervalDays + tolerance)) {
        compliantIntervals++;
      }
    }
  });

  const complianceRate = totalIntervals > 0 ? (compliantIntervals / totalIntervals) * 100 : 100;

  const kpiData = {
    asetGanti,
    tiketMasuk,
    rataRata: Math.round(avgUmur._avg.sisaUmurHari || 0),
    asetMaintenance,
    kepatuhan: Math.round(complianceRate),
  };

  // 5. Cost Trend Data (Rolling 12 Months: Jul 2025 to Jun 2026)
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const costTrendData: Record<string, any> = {};

  const tempDate = new Date(histStart);
  for (let i = 0; i < 12; i++) {
    const y = tempDate.getFullYear();
    const m = tempDate.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    const label = `${months[m]} ${String(y).slice(-2)}`;
    costTrendData[key] = {
      label,
      key,
      maintenance: 0,
      replacement: 0
    };
    tempDate.setMonth(tempDate.getMonth() + 1);
  }

  histComplaints.forEach(c => {
    if (!c.tanggalSelesai) return;
    const d = new Date(c.tanggalSelesai);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (costTrendData[key]) {
      costTrendData[key].maintenance += c.biayaPerbaikan;
    }
  });

  histReplacements.forEach(r => {
    const d = new Date(r.tanggalPenggantian);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (costTrendData[key]) {
      costTrendData[key].replacement += r.biayaPenggantian;
    }
  });

  const costTrendList = Object.values(costTrendData);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight">Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ringkasan kesehatan aset dan prediksi umur dari model Random Forest Regressor.
          </p>
        </div>
        <GlobalFilter />
      </div>

      {/* Layer 1 - Hero Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 p-4 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-destructive animate-pulse-ring relative">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            </span>
            <p className="text-sm font-medium leading-relaxed text-foreground">
              <strong className="font-extrabold text-destructive">{kpiData.asetGanti.toLocaleString("id-ID")} aset</strong> memiliki sisa umur 0 hari dan membutuhkan penggantian segera. Terdapat <strong className="font-extrabold text-warning">{buckets.perhatian.toLocaleString("id-ID")} aset</strong> dalam status pantau aktif minggu ini.
            </p>
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold whitespace-nowrap bg-background px-3 py-1.5 rounded-lg border border-border/50">
            Diperbarui {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Layer 1 - RUL Buckets Grid */}
      <div className="space-y-3">
        <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-slate-500/80">
          Distribusi Sisa Umur Aset (RUL)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card Kritis */}
          <Card className="relative overflow-hidden group bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-900/60 transition-colors shadow-none">
            <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />
            <CardContent className="p-4 flex flex-col justify-between h-36">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Tindakan segera</p>
                <h4 className="font-heading text-3xl font-extrabold tracking-tight mt-1 text-destructive">
                  {buckets.kritis.toLocaleString("id-ID")}
                </h4>
                <p className="text-[11px] font-medium text-slate-400 mt-1">aset &middot; sisa &lt; 7 hari</p>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-heading">
                  Kritis
                </span>
                <Sparkline variant="kritis" />
              </div>
            </CardContent>
          </Card>

          {/* Card Perhatian */}
          <Card className="relative overflow-hidden group bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-900/60 transition-colors shadow-none">
            <div className="absolute top-0 left-0 right-0 h-1 bg-warning" />
            <CardContent className="p-4 flex flex-col justify-between h-36">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Perlu direncanakan</p>
                <h4 className="font-heading text-3xl font-extrabold tracking-tight mt-1 text-warning">
                  {buckets.perhatian.toLocaleString("id-ID")}
                </h4>
                <p className="text-[11px] font-medium text-slate-400 mt-1">aset &middot; sisa 7&ndash;30 hari</p>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-warning/15 text-warning-foreground font-heading font-semibold">
                  Perhatian
                </span>
                <Sparkline variant="perhatian" />
              </div>
            </CardContent>
          </Card>

          {/* Card Monitor */}
          <Card className="relative overflow-hidden group bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-900/60 transition-colors shadow-none">
            <div className="absolute top-0 left-0 right-0 h-1 bg-watch" />
            <CardContent className="p-4 flex flex-col justify-between h-36">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Pantau</p>
                <h4 className="font-heading text-3xl font-extrabold tracking-tight mt-1 text-watch">
                  {buckets.monitor.toLocaleString("id-ID")}
                </h4>
                <p className="text-[11px] font-medium text-slate-400 mt-1">aset &middot; sisa 30&ndash;90 hari</p>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-watch/15 text-watch font-heading">
                  Monitor
                </span>
                <Sparkline variant="monitor" />
              </div>
            </CardContent>
          </Card>

          {/* Card Sehat */}
          <Card className="relative overflow-hidden group bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-900/60 transition-colors shadow-none">
            <div className="absolute top-0 left-0 right-0 h-1 bg-success" />
            <CardContent className="p-4 flex flex-col justify-between h-36">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Aman</p>
                <h4 className="font-heading text-3xl font-extrabold tracking-tight mt-1 text-success">
                  {buckets.sehat.toLocaleString("id-ID")}
                </h4>
                <p className="text-[11px] font-medium text-slate-400 mt-1">aset &middot; sisa &gt; 90 hari</p>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-success/15 text-success font-heading">
                  Sehat
                </span>
                <Sparkline variant="sehat" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Layer 1 - Metrik Operasional */}
      <div className="space-y-3">
        <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-slate-500/80">
          Metrik Operasional
        </h3>
        <KPICards data={kpiData} />
      </div>

      {/* Layer 2 - Heatmap Kiri & Category Bar Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeatmapGedungLantai data={heatmapData} />
        <CategoryRULBarChart data={categoryData} />
      </div>

      {/* Layer 3 - Cost Trend stack area */}
      <CostTrendChart data={costTrendList} />

      {/* Aset Perlu Perhatian Segera */}
      <div>
        <h3 className="font-heading text-sm font-semibold tracking-tight mb-3">
          Aset Perlu Perhatian Segera
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {criticalAssets.map((asset) => (
            <AssetHealthCard key={asset.id} asset={asset as any} compact={true} />
          ))}
        </div>
      </div>
    </div>
  );
}
