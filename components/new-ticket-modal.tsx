"use client";

import { useState, useRef, useEffect } from "react";
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
import { Mic, MicOff, Plus, FileText, AlertCircle, Loader2, Cpu, Building2, Layers, MapPin, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

export function NewTicketModal() {
  const router = useRouter();
  const { data: session } = useSession();
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
            setReportText((prev: string) => prev ? prev + " " + data.text : data.text);
            setAudioBlob(null); // Clear blob agar dikirim sebagai teks
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
      setPesanBot(null); // Reset alert
      setMissingEntities([]);
      setRawAiResponse(null);
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
          Swal.fire({
            icon: "info",
            title: "Laporan Kosong",
            text: "Silakan ketik keluhan atau rekam suara Anda.",
          });
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
        setOpen(false);
        resetForm();
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: result.message || "Tiket komplain berhasil dibuat.",
          confirmButtonColor: "#2563eb",
        }).then(() => {
          if (session) {
            router.push("/tiket");
            router.refresh();
          }
        });
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
      Swal.fire({
        icon: "error",
        title: "Kesalahan Sistem",
        text: "Terjadi kesalahan sistem saat mengirim laporan.",
      });
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

  const hasSubmitted = pesanBot !== null;
  
  // Dynamic parsing check based on entity list
  const isAsetMissing = hasSubmitted && missingEntities.some(e => e.toLowerCase().includes("aset") || e.toLowerCase().includes("benda"));
  const isGedungMissing = hasSubmitted && missingEntities.some(e => e.toLowerCase().includes("gedung") || e.toLowerCase().includes("lokasi"));
  const isLantaiMissing = hasSubmitted && missingEntities.some(e => e.toLowerCase().includes("lantai"));
  const isZonaMissing = hasSubmitted && missingEntities.some(e => e.toLowerCase().includes("zona") || e.toLowerCase().includes("ruang") || e.toLowerCase().includes("area") || e.toLowerCase().includes("spesifik"));

  const asetStatus = !hasSubmitted ? "neutral" : isAsetMissing ? "missing" : "found";
  const gedungStatus = !hasSubmitted ? "neutral" : isGedungMissing ? "missing" : "found";
  const lantaiStatus = !hasSubmitted ? "neutral" : isLantaiMissing ? "missing" : "found";
  const zonaStatus = !hasSubmitted ? "neutral" : isZonaMissing ? "missing" : "found";

  const getPillClass = (status: "neutral" | "missing" | "found") => {
    if (status === "found") {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/10";
    }
    if (status === "missing") {
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 dark:border-rose-500/20 animate-shake ring-1 ring-rose-500/15";
    }
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/80";
  };

  const getPillIcon = (status: "neutral" | "missing" | "found", defaultIcon: React.ReactNode) => {
    if (status === "found") return <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
    if (status === "missing") return <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 animate-pulse" />;
    return defaultIcon;
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Ticket</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-white/10 dark:border-white/5 shadow-2xl rounded-2xl p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b mb-4">
            <DialogTitle className="font-heading text-lg font-extrabold tracking-tight flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary animate-pulse" /> Buat Tiket Bantuan Pintar
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Ceritakan keluhan Anda sejelas mungkin agar teknisi bisa langsung meluncur. 
              Sistem AI akan otomatis membaca parameter berikut:
            </DialogDescription>
            
            {/* Dynamic checklist pills */}
            <div className="grid grid-cols-2 gap-2 pt-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${getPillClass(asetStatus)}`}>
                {getPillIcon(asetStatus, <Cpu className="h-3.5 w-3.5 text-slate-400 shrink-0" />)}
                <span className="truncate">Aset</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${getPillClass(gedungStatus)}`}>
                {getPillIcon(gedungStatus, <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />)}
                <span className="truncate">Lokasi Gedung</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${getPillClass(lantaiStatus)}`}>
                {getPillIcon(lantaiStatus, <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />)}
                <span className="truncate">Lantai</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${getPillClass(zonaStatus)}`}>
                {getPillIcon(zonaStatus, <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />)}
                <span className="truncate">Zona</span>
              </div>
            </div>
          </DialogHeader>
          
          <div className="grid gap-4 py-3">
            {/* Pesan Peringatan Bot */}
            {pesanBot && (
              <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3.5 rounded-xl border border-rose-500/20 flex items-start gap-3 text-xs leading-relaxed animate-fade-in-up">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
                <div className="flex flex-col gap-1 w-full overflow-hidden">
                  <p className="font-extrabold">{pesanBot}</p>
                  {missingEntities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {missingEntities.map((ent: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center bg-rose-500/20 dark:bg-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-500/20 uppercase tracking-wide">
                          {ent}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="keluhan" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deskripsi Masalah</Label>
                
                <div className="flex items-center gap-2">
                   <Button
                     type="button"
                     onClick={toggleRecording}
                     className={`h-8 gap-1.5 px-3 text-xs rounded-full font-semibold transition-all duration-300 cursor-pointer ${
                       isRecording 
                         ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                         : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                     }`}
                     disabled={isTranscribing || isLoading}
                   >
                     {isRecording ? (
                       <>
                         <span className="relative flex h-2 w-2">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                         </span>
                         Merekam...
                       </>
                     ) : isTranscribing ? (
                       <>
                         <Loader2 className="h-3 w-3 animate-spin text-primary" />
                         Transkripsi...
                       </>
                     ) : (
                       <>
                         <Mic className="h-3.5 w-3.5 text-primary" />
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
                className="min-h-[135px] rounded-xl border border-input bg-background/50 p-3.5 text-sm shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed font-sans"
                value={reportText}
                onChange={(e) => {
                  setReportText(e.target.value);
                  if (audioBlob) setAudioBlob(null); // Batal kirim audio jika user ngetik
                }}
                disabled={isRecording || isLoading || isTranscribing}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t border-border/40 flex flex-col sm:flex-row gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="rounded-xl w-full sm:w-auto cursor-pointer"
              disabled={isLoading || isRecording}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || isRecording || !reportText.trim()} 
              className="gap-2 w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-sm cursor-pointer"
            >
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
