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
import { Mic, MicOff, Plus, FileText } from "lucide-react";

export function NewTicketModal() {
  const [open, setOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [reportText, setReportText] = useState("");
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "id-ID";

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
             setReportText((prev) => prev + (prev ? " " : "") + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert("Browser Anda tidak mendukung fitur Voice to Text.");
        return;
      }
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setTimeout(() => {
      setOpen(false);
      setReportText("");
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen && isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Ticket</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Buat Tiket Laporan</DialogTitle>
            <DialogDescription>
              Laporkan kerusakan aset. Anda bisa mengetik atau menggunakan suara.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="report">Deskripsi Kerusakan</Label>
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "secondary"}
                  size="sm"
                  onClick={toggleListening}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-3 w-3 animate-pulse" />
                      Stop Record
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3" />
                      Voice Input
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="report"
                placeholder="Deskripsikan masalah yang terjadi pada aset..."
                className="min-h-[150px]"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                required
              />
              {isListening && (
                <p className="text-[10px] text-muted-foreground animate-pulse text-right">
                  Mendengarkan suara Anda...
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="gap-2">
              <FileText className="h-4 w-4" />
              Kirim Laporan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
