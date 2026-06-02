import { KPICards } from "@/components/kpi-cards";
import { AssetHealthCard } from "@/components/asset-health-card";
import { HealthDonutChart, DamageFrequencyChart } from "@/components/charts";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Overview",
  description: "Dashboard overview prediksi umur aset dan early warning system.",
};

export default async function OverviewPage() {
  const criticalAssets = await prisma.masterAsset.findMany({
    where: { status: "Aktif" },
    orderBy: { sisaUmurHari: "asc" },
    take: 5,
  });

  const [totalAset, asetKritis, avgUmur] = await Promise.all([
    prisma.masterAsset.count({ where: { status: "Aktif" } }),
    prisma.masterAsset.count({ where: { status: "Aktif", sisaUmurHari: { lte: 30 } } }),
    prisma.masterAsset.aggregate({
      where: { status: "Aktif" },
      _avg: { sisaUmurHari: true }
    }),
  ]);

  const kpiData = {
    totalAset,
    asetKritis,
    rataRata: Math.round(avgUmur._avg.sisaUmurHari || 0),
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
    Watch: "hsl(48 96% 53%)",
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



  const complaints = await prisma.assetComplaint.findMany({
    select: { tanggalPerencanaan: true },
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const frequencyMap: Record<string, number> = {};

  complaints.forEach(c => {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Overview</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ringkasan kesehatan aset dan prediksi umur dari model Random Forest Regressor.
        </p>
      </div>

      <KPICards data={kpiData} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 flex">
          <div className="w-full">
            <HealthDonutChart data={healthData} />
          </div>
        </div>
        <div className="lg:col-span-3 flex">
          <div className="w-full">
            <DamageFrequencyChart data={damageData} />
          </div>
        </div>
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
