import { AssetTable } from "@/components/asset-table";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const metadata = {
  title: "Daftar Aset",
  description: "Daftar lengkap semua aset dengan filter dan sorting.",
};

// Next.js 13+ Page Props untuk mengambil query parameter (untuk pagination)
export default async function AsetPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; category?: string; status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const isTeknisi = session?.user?.role === "TEKNISI";

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = 100; // Tampilkan 100 aset per halaman

  // Buat query filter Prisma
  const whereClause: any = {
    status: "Aktif"
  };
  
  if (params.q) {
    whereClause.OR = [
      { id: { contains: params.q, mode: 'insensitive' } },
      { nama: { contains: params.q, mode: 'insensitive' } },
    ];
  }
  
  if (params.category && params.category !== "all") {
    whereClause.kategori = params.category;
  }
  
  if (params.status && params.status !== "all") {
    if (params.status === "Critical") {
      whereClause.sisaUmurHari = { lte: 30 };
    } else if (params.status === "Warning") {
      whereClause.sisaUmurHari = { gt: 30, lte: 90 };
    } else if (params.status === "Watch") {
      whereClause.sisaUmurHari = { gt: 90, lte: 180 };
    } else if (params.status === "Healthy") {
      whereClause.sisaUmurHari = { gt: 180 };
    }
  }

  // Tarik data dari database beserta total count untuk pagination
  const [assets, totalCount] = await Promise.all([
    prisma.masterAsset.findMany({
      where: whereClause,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { sisaUmurHari: "asc" }, // Urutkan aset paling kritis dulu
    }),
    prisma.masterAsset.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Ambil data filter unik dari DB untuk dropdown
  const categoriesDb = await prisma.masterAsset.groupBy({
    by: ['kategori'],
    where: { status: "Aktif" },
    _count: true
  });
  const locationsDb = await prisma.masterAsset.groupBy({
    by: ['lokasiGedung'],
    where: { status: "Aktif" },
    _count: true
  });

  const categories = categoriesDb.map((c: any) => c.kategori).filter(Boolean).sort((a: string, b: string) => a.localeCompare(b));
  const locations = locationsDb.map((l: any) => l.lokasiGedung).filter(Boolean).sort((a: string, b: string) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Daftar Aset</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Menampilkan {assets.length} dari total {totalCount} aset.
        </p>
      </div>
      
      <AssetTable
        initialAssets={assets as any[]}
        categories={categories}
        currentPage={page}
        totalPages={totalPages}
        searchParams={params}
        isTeknisi={isTeknisi}
      />
    </div>
  );
}
