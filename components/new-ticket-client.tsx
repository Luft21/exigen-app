"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buatTiketOtomatisClient } from "@/app/actions/ticket";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function NewTicketClient() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(buatTiketOtomatisClient, { success: false, error: undefined });

  useEffect(() => {
    if (state.success) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Tiket komplain berhasil dibuat.',
        confirmButtonColor: '#10b981'
      }).then(() => {
        router.push("/tiket");
      });
    } else if (state.error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: state.error,
      });
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
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

      <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
          </>
        ) : (
          "Kirim Laporan"
        )}
      </Button>
    </form>
  );
}
