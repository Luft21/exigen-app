"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export function GlobalFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentPeriod = searchParams.get("period") || "all";
  const [showCustom, setShowCustom] = useState(currentPeriod === "custom");
  const [startDate, setStartDate] = useState(searchParams.get("start") || "");
  const [endDate, setEndDate] = useState(searchParams.get("end") || "");

  useEffect(() => {
    setShowCustom(currentPeriod === "custom");
  }, [currentPeriod]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "custom") {
      setShowCustom(true);
      return;
    }
    
    setShowCustom(false);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("start");
    newParams.delete("end");
    
    if (val === "all") {
      newParams.delete("period");
    } else {
      newParams.set("period", val);
    }
    router.push(`${pathname}?${newParams.toString()}`);
  };

  const applyCustom = () => {
    let finalStart = startDate;
    let finalEnd = endDate;

    // Auto-swap dates if they are reversed
    if (finalStart && finalEnd && new Date(finalStart) > new Date(finalEnd)) {
      finalStart = endDate;
      finalEnd = startDate;
      setStartDate(finalStart);
      setEndDate(finalEnd);
    }

    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("period", "custom");
    if (finalStart) newParams.set("start", finalStart);
    else newParams.delete("start");
    
    if (finalEnd) newParams.set("end", finalEnd);
    else newParams.delete("end");
    
    router.push(`${pathname}?${newParams.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground hidden lg:inline-block">Filter:</span>
        <select 
          className="text-sm bg-background border border-input rounded-md px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer font-medium"
          value={currentPeriod === "custom" ? "custom" : currentPeriod}
          onChange={handleChange}
        >
          <option value="all">Semua Waktu</option>
          <option value="year">1 Tahun</option>
          <option value="6month">6 Bulan</option>
          <option value="3month">3 Bulan</option>
          <option value="month">1 Bulan</option>
          <option value="week">7 Hari</option>
          <option value="custom">Kustom...</option>
        </select>
      </div>

      {showCustom && (
        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-4">
          <input 
            type="date" 
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-sm bg-background border border-input rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <input 
            type="date" 
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-sm bg-background border border-input rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
          />
          <button 
            onClick={applyCustom}
            className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors font-medium ml-1"
          >
            Terapkan
          </button>
        </div>
      )}
    </div>
  );
}
