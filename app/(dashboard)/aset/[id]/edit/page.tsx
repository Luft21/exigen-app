import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Wrench, AlertTriangle } from "lucide-react";
import { FormPerbaikanAset } from "@/components/form-perbaikan-aset";

const EDITABLE_STATUSES = ["Warning", "Critical"];

export const metadata = { title: "Perbaikan Aset" };

export default async function EditAsetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TEKNISI") redirect("/aset");

  const aset = await prisma.masterAsset.findUnique({ where: { id } });
  if (!aset) redirect("/aset");

  // Guard: hanya aset berstatus Warning atau Critical yang bisa diedit
  if (!EDITABLE_STATUSES.includes(aset.healthStatus)) redirect("/aset");

  const [uniqueKerusakan, uniquePenyebab, uniqueSparepart] = await Promise.all([
    prisma.assetComplaint.findMany({
      where: { jenisKerusakan: { not: "-" } },
      select: { jenisKerusakan: true },
      distinct: ["jenisKerusakan"],
    }),
    prisma.assetComplaint.findMany({
      where: { penyebab: { not: "-" } },
      select: { penyebab: true },
      distinct: ["penyebab"],
    }),
    prisma.assetComplaint.findMany({
      where: { sparePartDigunakan: { not: "-" } },
      select: { sparePartDigunakan: true },
      distinct: ["sparePartDigunakan"],
    }),
  ]);

  const isCritical = aset.sisaUmurHari <= 30;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/aset">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Kembali ke Daftar Aset
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">
          Perbaikan Aset
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Catat perbaikan untuk <strong>{aset.nama}</strong> dan update kondisi
          aset setelah selesai.
        </p>
      </div>

      {/* Warning banner */}
      <div
        className={`flex items-start gap-3 rounded-lg border p-4 ${
          isCritical
            ? "border-destructive/30 bg-destructive/5"
            : "border-warning/30 bg-warning/5"
        }`}
      >
        <AlertTriangle
          className={`h-4 w-4 mt-0.5 shrink-0 ${
            isCritical ? "text-destructive" : "text-warning"
          }`}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <p
            className={`text-sm ${isCritical ? "text-destructive" : "text-warning"}`}
          >
            Sisa umur aset ini hanya{" "}
            <strong>{aset.sisaUmurHari} hari</strong> —{" "}
            {isCritical ? "kondisi kritis." : "perlu perhatian segera."}
          </p>
          <Badge
            variant="outline"
            className={
              isCritical
                ? "bg-destructive/10 text-destructive border-destructive/30"
                : "bg-warning/10 text-warning border-warning/30"
            }
          >
            {aset.healthStatus}
          </Badge>
        </div>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="font-heading text-sm flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Form Perbaikan Aset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormPerbaikanAset
            aset={{
              ...aset,
              estimasiPenggantian: aset.estimasiPenggantian,
            }}
            uniqueKerusakan={uniqueKerusakan.map((k) => k.jenisKerusakan)}
            uniquePenyebab={uniquePenyebab.map((p) => p.penyebab)}
            uniqueSparepart={uniqueSparepart.map((s) => s.sparePartDigunakan)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
