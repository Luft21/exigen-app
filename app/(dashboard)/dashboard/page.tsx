import { KPICards } from "@/components/kpi-cards";
import { AssetHealthCard } from "@/components/asset-health-card";
import { HealthDonutChart, SisaUmurBarChart, DamageFrequencyChart } from "@/components/charts";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Overview",
  description: "Dashboard overview prediksi umur aset dan early warning system.",
};

export default async function OverviewPage() {
  const criticalAssets = await prisma.masterAsset.findMany({
    orderBy: { sisaUmurHari: "asc" },
    take: 3,
  });

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

  const healthGroupBy = await prisma.masterAsset.groupBy({
    by: ['healthStatus'],
    _count: true,
  });

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

  const categoryGroupBy = await prisma.masterAsset.groupBy({
    by: ['kategori'],
    _avg: { sisaUmurHari: true },
  });

  const barData = categoryGroupBy.map(c => ({
    kategori: c.kategori,
    rataRata: Math.round(c._avg.sisaUmurHari || 0),
  }));

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

  const damageData = Object.entries(frequencyMap).map(([bulan, jumlah]) => ({
    bulan,
    jumlah
  })).slice(-12);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan kesehatan aset dan prediksi umur dari model Random Forest Regressor.
        </p>
      </div>

      <KPICards data={kpiData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthDonutChart data={healthData} />
        <SisaUmurBarChart data={barData} />
      </div>

      <DamageFrequencyChart data={damageData} />

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
