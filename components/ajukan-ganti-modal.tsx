"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertTriangle, Mic, MicOff, Loader2 } from "lucide-react";
import { ajukanPenggantian } from "@/app/actions/ticket";
import Swal from "sweetalert2";

export function AjukanGantiModal({ tiketId, namaAset, isGantiDitolak = false }: { tiketId: string; namaAset: string; isGantiDitolak?: boolean }) {
  const [open, setOpen] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Create audio file
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());

        // Langsung transkripsi untuk preview
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("file", blob, "audio.webm");

          const res = await fetch("/api/ticket/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setAlasan((prev: string) => prev ? prev + " " + data.text : data.text);
          } else {
            console.error("Transkripsi gagal:", data.error);
            Swal.fire({
              icon: "error",
              title: "Transkripsi Gagal",
              text: "Gagal melakukan transkripsi suara: " + (data.error || "Unknown error"),
            });
          }
        } catch (error) {
          console.error("Error transcribing:", error);
          Swal.fire({
            icon: "error",
            title: "Kesalahan Sistem",
            text: "Terjadi kesalahan sistem saat transkripsi suara.",
          });
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Gagal mengakses mikrofon", err);
      Swal.fire({
        icon: "warning",
        title: "Akses Mikrofon Ditolak",
        text: "Tidak dapat mengakses mikrofon. Pastikan Anda telah memberikan izin.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setAlasan("");
      if (isRecording) stopRecording();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("idTiket", tiketId);
      formData.append("alasan", alasan);
      await ajukanPenggantian(formData);
      setOpen(false);
      setAlasan("");
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Diajukan',
        text: 'Permintaan penggantian aset telah dikirim ke Manajemen.',
        confirmButtonColor: '#10b981'
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal mengajukan penggantian.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive border-destructive/50 hover:bg-destructive hover:text-destructive-foreground">
          <CheckCircle className="h-3 w-3" /> Ajukan Ganti
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Ajukan Penggantian Aset
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 text-sm text-destructive">
            Anda akan mengajukan penggantian untuk aset <strong>{namaAset}</strong>. Tiket ini akan ditunda hingga mendapat persetujuan dari Manajemen / Admin.
          </div>

          {isGantiDitolak && (
            <div className="bg-orange-500/10 p-3 rounded-md border border-orange-500/20 text-sm text-orange-600 font-medium">
              ⚠️ Pengajuan penggantian untuk tiket ini sebelumnya telah DITOLAK oleh Manajemen. Pastikan Anda memiliki alasan (Root Cause) yang lebih kuat jika ingin mengajukan ulang!
            </div>
          )}

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="alasan">Alasan Penggantian (Root Cause)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "secondary"}
                  size="sm"
                  onClick={toggleRecording}
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={isTranscribing || loading}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-3 w-3 animate-pulse" />
                      Stop Record
                    </>
                  ) : isTranscribing ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Transkripsi...
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3" />
                      Voice Note
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              id="alasan"
              placeholder="Contoh: Kompresor terbakar total, biaya perbaikan melebihi harga beli baru..."
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              required
              className="min-h-[100px]"
              disabled={isRecording || loading || isTranscribing}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
            <Button type="submit" variant="destructive" disabled={!alasan || loading || isRecording || isTranscribing}>
              {loading ? "Mengajukan..." : "Kirim Pengajuan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
