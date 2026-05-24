"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Box,
  Wrench,
  RefreshCw,
  Activity,
  ClipboardEdit,
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
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "Aset", href: "/aset", icon: Box },
  { title: "Maintenance", href: "/maintenance", icon: Wrench },
  { title: "Penggantian", href: "/penggantian", icon: RefreshCw },
];

const dataItems = [
  { title: "Input Servis", href: "/input-servis", icon: ClipboardEdit },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
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
                item.href === "/"
                  ? pathname === "/"
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

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-4">
            Data & Teknisi
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1 px-1">
            {dataItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
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

      <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            Model RF Active
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
