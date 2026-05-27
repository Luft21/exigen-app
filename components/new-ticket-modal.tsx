"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Plus, FileText, AlertCircle, Loader2 } from "lucide-react";

export function NewTicketModal() {
  const [open, setOpen] = useState(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Form states
  const [reportText, setReportText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pesanBot, setPesanBot] = useState<string | null>(null);
  const [missingEntities, setMissingEntities] = useState<string[]>([]);
  const [rawAiResponse, setRawAiResponse] = useState<any>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

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
        setAudioBlob(blob);
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
            setReportText(prev => prev ? prev + " " + data.text : data.text);
            setAudioBlob(null); // Clear blob agar dikirim sebagai teks
          } else {
            console.error("Transkripsi gagal:", data.error);
            alert("Gagal melakukan transkripsi suara: " + (data.error || "Unknown error"));
          }
        } catch (error) {
          console.error("Error transcribing:", error);
          alert("Terjadi kesalahan sistem saat transkripsi suara.");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setPesanBot(null); // Reset alert
      setMissingEntities([]);
      setRawAiResponse(null);
    } catch (err) {
      console.error("Gagal mengakses mikrofon", err);
      alert("Tidak dapat mengakses mikrofon. Pastikan Anda telah memberikan izin.");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPesanBot(null);
    setMissingEntities([]);
    setRawAiResponse(null);

    try {
      let res;

      // Jika ada rekaman suara yang belum dikirim
      if (audioBlob) {
        const formData = new FormData();
        // Beri nama file audio.wav agar diterima backend Python (validasi ekstensi)
        formData.append("file", audioBlob, "audio.wav");

        res = await fetch("/api/ticket/predict", {
          method: "POST",
          body: formData,
        });
      } else {
        // Kirim teks murni
        if (!reportText.trim()) {
          alert("Silakan ketik keluhan atau rekam suara Anda.");
          setIsLoading(false);
          return;
        }

        res = await fetch("/api/ticket/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teks_keluhan: reportText }),
        });
      }

      const result = await res.json();

      if (!res.ok) {
        setPesanBot(result.error || result.message || "Gagal menghubungi server. Periksa koneksi ke AI.");
        setIsLoading(false);
        return;
      }

      if (result.success) {
        // Tiket berhasil dibuka
        alert(result.message);
        setOpen(false);
        resetForm();
      } else {
        // Tiket kurang lengkap (Draft)
        setPesanBot(result.message);
        setMissingEntities(result.missing_entities || []);
        if (result.raw_ai_response) setRawAiResponse(result.raw_ai_response);
        
        // Jika API mengembalikan teks asli (misal dari transkripsi audio),
        // letakkan di text area agar user bisa lanjut mengetik tambahannya
        if (result.draft_data && result.draft_data.teks_asli) {
           setReportText(result.draft_data.teks_asli);
           setAudioBlob(null);
        }
      }
    } catch (error) {
      console.error("Error submitting ticket", error);
      alert("Terjadi kesalahan sistem saat mengirim laporan.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setReportText("");
    setAudioBlob(null);
    setPesanBot(null);
    setMissingEntities([]);
    setRawAiResponse(null);
    if (isRecording) stopRecording();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Ticket</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Buat Tiket Bantuan Pintar</DialogTitle>
            <DialogDescription className="text-sm">
              Ceritakan keluhan Anda sejelas mungkin agar teknisi bisa langsung meluncur. 
              Pastikan Anda menyebutkan: <br />
              <span className="font-semibold text-primary">1. Benda/Aset yang rusak</span> • 
              <span className="font-semibold text-primary"> 2. Lokasi Gedung & Lantai</span> • 
              <span className="font-semibold text-primary"> 3. Ruangan spesifik</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            
            {/* Pesan Peringatan Bot (Jika is_complete false) */}
            {pesanBot && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md flex items-start gap-3 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1 w-full overflow-hidden">
                  <p className="font-medium">{pesanBot}</p>
                  {missingEntities.length > 0 && (
                    <ul className="list-disc pl-4 text-xs opacity-90">
                      {missingEntities.map((ent, idx) => (
                        <li key={idx}>Mohon lengkapi info: <span className="font-semibold">{ent}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="keluhan">Deskripsi Masalah</Label>
                
                <div className="flex items-center gap-2">
                   <Button
                     type="button"
                     variant={isRecording ? "destructive" : "secondary"}
                     size="sm"
                     onClick={toggleRecording}
                     className="h-7 gap-1 px-2 text-xs"
                     disabled={isTranscribing || isLoading}
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
                id="keluhan"
                name="keluhan"
                placeholder="Contoh: AC split di ruang HRD gedung utama lantai 2 bocor parah netes air..."
                className="min-h-[120px]"
                value={reportText}
                onChange={(e) => {
                  setReportText(e.target.value);
                  if (audioBlob) setAudioBlob(null); // Batal kirim audio jika user ngetik
                }}
                disabled={isRecording || isLoading || isTranscribing}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading || isRecording} className="gap-2 w-full sm:w-auto">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {isLoading ? "Memproses AI..." : "Kirim Laporan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
