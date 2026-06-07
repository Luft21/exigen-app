"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Box,
  Wrench,
  RefreshCw,
  Activity,
  Ticket,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Tiket Komplain", href: "/tiket", icon: Ticket },
  { title: "Aset", href: "/aset", icon: Box },
  { title: "Maintenance", href: "/maintenance", icon: Wrench },
  { title: "Penggantian", href: "/penggantian", icon: RefreshCw },
];

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.nama ?? session?.user?.username ?? "User";
  const userRole = session?.user?.role;
  const initials = getInitials(userName);

  const isManajemen = userRole === "MANAJEMEN";

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-sm font-bold tracking-tight text-sidebar-foreground">
              EXIGEN
            </span>
            <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
              Asset Health
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-4">
            Menu Utama
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1 px-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className={cn(
                      "w-full rounded-lg px-3 transition-all duration-150",
                      "hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                      isActive &&
                      "bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 hover:text-primary-foreground"
                    )}
                  >
                    <Link href={item.href} className="flex w-full items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 group-data-[collapsible=icon]:justify-center">

          {/* Avatar dengan dot status */}
          <div className="relative shrink-0">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold tracking-wide",
                isManajemen
                  ? "bg-primary/15 text-primary"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              )}
            >
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-success" />
          </div>

          {/* Nama + role */}
          <div className="flex flex-1 flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-xs font-semibold text-sidebar-foreground leading-none">
              {userName}
            </span>
            <span className={cn(
              "mt-0.5 text-[10px] font-medium",
              isManajemen ? "text-primary" : "text-amber-500"
            )}>
              {isManajemen ? "Manajemen" : "Teknisi"}
            </span>
          </div>

          {/* Logout — tampil di expanded mode */}
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/login";
            }}
            title="Logout"
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>

        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
