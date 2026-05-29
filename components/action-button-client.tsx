"use client";

import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import { useState } from "react";

export function ActionButtonClient({
  action,
  children,
  variant = "default",
  className,
  confirmTitle,
  confirmText,
  successTitle,
  successText,
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  confirmTitle?: string;
  confirmText?: string;
  successTitle?: string;
  successText?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (confirmTitle) {
      const result = await Swal.fire({
        title: confirmTitle,
        text: confirmText,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: variant === "destructive" ? "#ef4444" : "#10b981",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Ya, Lanjutkan!",
        cancelButtonText: "Batal"
      });

      if (!result.isConfirmed) return;
    }

    setLoading(true);
    try {
      await action();
      if (successTitle) {
        Swal.fire({
          icon: "success",
          title: successTitle,
          text: successText,
          confirmButtonColor: "#10b981",
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan sistem.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      size="sm" 
      variant={variant} 
      className={className} 
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "Proses..." : children}
    </Button>
  );
}
