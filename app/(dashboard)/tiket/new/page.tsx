import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareWarning, Database } from "lucide-react";
import { buatTiketOtomatis } from "@/app/actions/ticket";

export const metadata = {
  title: "New Ticket",
};

export default function NewTicketPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">
          New Ticket Komplain
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Buat tiket komplain baru. AI NLP akan otomatis mengkategorikan dan menentukan tingkat severity kerusakan.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 animate-fade-in-up">
        <Database className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Integrasi AI NLP
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pastikan server FastAPI Python Anda berjalan di background (port 8000). Teks keluhan akan dikirim ke sana untuk diklasifikasikan secara otomatis sebelum disimpan ke database.
          </p>
        </div>
      </div>

      <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: "100ms" }}>
        <CardHeader>
          <CardTitle className="font-heading text-sm flex items-center gap-2">
            <MessageSquareWarning className="h-4 w-4" />
            Form Keluhan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Gunakan Server Action langsung di form */}
          <form action={buatTiketOtomatis} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="idAset">ID Aset</Label>
              <Input
                id="idAset"
                name="idAset"
                placeholder="Ketik ID Aset (contoh: AST-TMP-xyz...)"
                required
              />
              <p className="text-[10px] text-muted-foreground">
                (Dalam versi produksi sebetulnya bisa pakai fitur pencarian/autocomplete via API)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="keluhan">Deskripsi Keluhan</Label>
              <Textarea
                id="keluhan"
                name="keluhan"
                placeholder="Tuliskan secara detail gejala kerusakannya..."
                className="min-h-[120px]"
                required
              />
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              Kirim Laporan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
