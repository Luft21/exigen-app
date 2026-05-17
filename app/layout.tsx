import type { Metadata } from "next";
import { JetBrains_Mono, Work_Sans } from "next/font/google";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { NewTicketModal } from "@/components/new-ticket-modal";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Exigen — Asset Health Dashboard",
    template: "%s | Exigen",
  },
  description:
    "Dashboard prediksi umur aset end-to-end dengan Random Forest Regressor. Visualisasi sisa umur, early warning, dan riwayat maintenance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${jetbrainsMono.variable} ${workSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans antialiased">
        <TooltipProvider delayDuration={200}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0">
              <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-md px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-sm font-semibold tracking-tight">
                    Asset Health Predictor
                  </h1>
                  <span className="hidden sm:inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-heading text-primary tracking-wider uppercase">
                    Random Forest
                  </span>
                </div>
                <div className="ml-auto flex items-center">
                  <NewTicketModal />
                </div>
              </header>
              <main className="flex-1 p-4 md:p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
