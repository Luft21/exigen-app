import { PrismaClient, Role } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approvePenggantian } from "@/app/actions/ticket";
import { CheckCircle } from "lucide-react";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Review Penggantian Aset",
};

export default async function ReviewPenggantianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.MANAJEMEN) {
    redirect("/"); // Hanya admin/manajemen
  }

  const tiket = await prisma.assetComplaint.findUnique({
    where: { id },
  });

  if (!tiket) {
    return <div>Tiket tidak ditemukan.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">Review Penggantian Aset</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Teknisi mengajukan penggantian untuk tiket <strong>{tiket.id}</strong>.
        </p>
      </div>

      <Card className="animate-fade-in-up overflow-hidden">
        <CardHeader>
          <CardTitle className="font-heading text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> Form Persetujuan Ganti Aset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={approvePenggantian} className="space-y-6">
            <input type="hidden" name="idTiket" value={tiket.id} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>ID Aset Lama</Label>
                <Input value={tiket.idAset ?? ""} readOnly className="bg-muted/40" />
              </div>
              <div className="grid gap-2">
                <Label>Nama Aset Lama</Label>
                <Input value={tiket.namaAset} readOnly className="bg-muted/40" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Alasan Penggantian (Bisa diedit/disempurnakan Admin)</Label>
              <Textarea 
                name="alasan" 
                defaultValue={tiket.penyebab}
                required 
                className="min-h-[80px]"
              />
            </div>

            <div className="border-t pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="idAsetBaru">ID Aset Baru yang Diberikan</Label>
                <Input 
                  id="idAsetBaru"
                  name="idAsetBaru" 
                  placeholder="Contoh: AST-NEW-123..." 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="biaya">Biaya Penggantian (Harga Aset Baru)</Label>
                <Input 
                  id="biaya"
                  type="number" 
                  name="biaya" 
                  min="0"
                  placeholder="0"
                  required 
                />
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto bg-success hover:bg-success/90">
              Setujui & Catat ke Riwayat
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
