import { KPICards } from "@/components/kpi-cards";
import { AssetHealthCard } from "@/components/asset-health-card";
import { HealthDonutChart, SisaUmurBarChart, DamageFrequencyChart } from "@/components/charts";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Overview",
  description: "Dashboard overview prediksi umur aset dan early warning system.",
};

export default async function OverviewPage() {
  // 1. Fetch Top 3 Critical Assets
  const criticalAssets = await prisma.masterAsset.findMany({
    orderBy: { sisaUmurHari: "asc" },
    take: 3,
  });

  // 2. Fetch Aggregations for KPIs
  const [totalAset, asetKritis, avgUmur] = await Promise.all([
    prisma.masterAsset.count(),
    prisma.masterAsset.count({ where: { sisaUmurHari: { lte: 30 } } }),
    prisma.masterAsset.aggregate({ _avg: { sisaUmurHari: true } }),
  ]);

  const kpiData = {
    totalAset,
    asetKritis,
    rataRata: Math.round(avgUmur._avg.sisaUmurHari || 0),
  };

  // 3. Fetch Data for Health Donut Chart
  const healthGroupBy = await prisma.masterAsset.groupBy({
    by: ['healthStatus'],
    _count: true,
  });

  // Format data for Donut Chart
  const healthColors: Record<string, string> = {
    Healthy: "hsl(142 71% 45%)",
    Watch: "hsl(48 96% 53%)",
    Warning: "hsl(25 95% 53%)",
    Critical: "hsl(0 84% 60%)",
  };
  
  const healthData = healthGroupBy.map(h => ({
    name: h.healthStatus,
    value: h._count,
    fill: healthColors[h.healthStatus] || "hsl(210 40% 50%)",
  }));

  // 4. Fetch Data for Bar Chart
  const categoryGroupBy = await prisma.masterAsset.groupBy({
    by: ['kategori'],
    _avg: { sisaUmurHari: true },
  });
  
  const barData = categoryGroupBy.map(c => ({
    kategori: c.kategori,
    rataRata: Math.round(c._avg.sisaUmurHari || 0),
  }));

  // 5. Fetch Data for Line Chart (Damage Frequency)
  // Tarik tanggal aja biar ringan, lalu grouping di memory
  const complaints = await prisma.assetComplaint.findMany({
    select: { tanggalPerencanaan: true }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const frequencyMap: Record<string, number> = {};
  
  complaints.forEach(c => {
    const d = new Date(c.tanggalPerencanaan);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    frequencyMap[label] = (frequencyMap[label] || 0) + 1;
  });

  // Sort by date (simple approach: sort keys string comparison is not enough, but we'll use array order if we construct it sequentially, or assume the past 6 months)
  // For simplicity, just map it out and sort by raw dates if needed.
  // We'll just pass the map as an array
  const damageData = Object.entries(frequencyMap).map(([bulan, jumlah]) => ({
    bulan,
    jumlah
  })).slice(-12); // Tampilkan max 12 bulan terakhir (Note: Sorting might not be chronological if keys unordered)

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan kesehatan aset dan prediksi umur dari model Random Forest Regressor.
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards data={kpiData} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthDonutChart data={healthData} />
        <SisaUmurBarChart data={barData} />
      </div>

      {/* Damage Frequency */}
      <DamageFrequencyChart data={damageData} />

      {/* Critical Assets */}
      <div>
        <h3 className="font-heading text-sm font-semibold tracking-tight mb-3">
          Aset Perlu Perhatian Segera
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {criticalAssets.map((asset) => (
            <AssetHealthCard key={asset.id} asset={asset as any} />
          ))}
        </div>
      </div>
    </div>
  );
}
