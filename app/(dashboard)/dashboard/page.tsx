import { KPICards } from "@/components/kpi-cards";
import { AssetHealthCard } from "@/components/asset-health-card";
import { HealthDonutChart, DamageFrequencyChart, LocationDamageChart } from "@/components/charts";
import { GlobalFilter } from "@/components/global-filter";
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

  const [asetGanti, avgUmur, maintenanceComplaints, complaintsWithAsset, tiketMasuk] = await Promise.all([
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
    })
  ]);

  const maintenanceAsetIds = new Set(maintenanceComplaints.map(c => c.idAset).filter(Boolean));
  const asetMaintenance = maintenanceAsetIds.size;

  const kpiData = {
    asetGanti,
    tiketMasuk,
    rataRata: Math.round(avgUmur._avg.sisaUmurHari || 0),
    asetMaintenance,
  };

  const allAssetsHealth = await prisma.masterAsset.findMany({
    where: { status: "Aktif" },
    select: { sisaUmurHari: true }
  });

  const healthCounts = { Healthy: 0, Watch: 0, Warning: 0, Critical: 0 };
  allAssetsHealth.forEach(a => {
    const rul = a.sisaUmurHari || 0;
    if (rul <= 30) healthCounts.Critical++;
    else if (rul <= 90) healthCounts.Warning++;
    else if (rul <= 180) healthCounts.Watch++;
    else healthCounts.Healthy++;
  });

  const healthColors: Record<string, string> = {
    Healthy: "hsl(142 71% 45%)",
    Watch: "hsl(38 92% 50%)",
    Warning: "hsl(25 95% 53%)",
    Critical: "hsl(0 84% 60%)",
  };

  const healthData = Object.entries(healthCounts)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: status,
      value: count,
      fill: healthColors[status] || "hsl(210 40% 50%)",
    }));



  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const frequencyMap: Record<string, number> = {};

  complaintsWithAsset.forEach(c => {
    if (!c.tanggalPerencanaan) return;
    const d = new Date(c.tanggalPerencanaan);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    frequencyMap[key] = (frequencyMap[key] || 0) + 1;
  });

  const sortedKeys = Object.keys(frequencyMap).sort();

  const damageData = sortedKeys.map(key => {
    const [year, month] = key.split('-');
    const label = `${monthNames[parseInt(month, 10) - 1]} ${year.slice(-2)}`;
    return {
      bulan: label,
      jumlah: frequencyMap[key]
    };
  }).slice(-12);

  const rawLocationData = complaintsWithAsset.map(c => ({
    tanggal: c.tanggalPerencanaan ? c.tanggalPerencanaan.toISOString() : new Date().toISOString(),
    lokasi: c.asset?.lokasiGedung || "Tidak Diketahui"
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight">Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ringkasan kesehatan aset dan prediksi umur dari model Random Forest Regressor.
          </p>
        </div>
        <GlobalFilter />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HealthDonutChart data={healthData} large={true} />
        </div>
        <div className="lg:col-span-1">
          <KPICards data={kpiData} className="grid-cols-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LocationDamageChart rawData={rawLocationData} height={320} />
        <DamageFrequencyChart data={damageData} height={320} />
      </div>

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
