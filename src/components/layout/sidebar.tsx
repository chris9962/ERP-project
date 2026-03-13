"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, LogOut, X } from "lucide-react";
import { getSidebarPages } from "@/lib/navigation";
import { brand } from "@/config/brand";

type SidebarProps = {
  mobileOpen?: boolean;
  onCloseAction?: () => void;
};

export function Sidebar({ mobileOpen = false, onCloseAction }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { profile, roleName, roleLabel } = useAuth();
  const filteredNav = getSidebarPages(roleName);

  async function handleSignOut() {
    try {
      await fetch("/auth/signout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  const initials = profile?.full_name
    ? profile.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "U";

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col border-r border-neutral-200 bg-white transition-all duration-300",
        "h-dvh max-h-dvh",
        "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]",
        "fixed inset-y-0 left-0 z-[60] w-[260px] md:relative md:z-auto md:translate-x-0 md:pt-0 md:pb-0 md:pl-0",
        "transform transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        collapsed ? "md:w-[68px]" : "md:w-[260px]",
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={onCloseAction}>
          <div
            className={cn(
              "relative shrink-0 overflow-hidden",
              brand.showSidebarName && "rounded-lg bg-neutral-100"
            )}
            style={{
              height: brand.showSidebarName ? 36 : 28,
              width: brand.showSidebarName ? 36 : 120,
            }}
          >
            <Image
              src={brand.logo}
              alt={brand.name}
              fill
              className="object-contain"
              sizes={`${Math.round(32 * brand.logoRatio)}px`}
              priority
            />
          </div>
          {brand.showSidebarName && (!collapsed || mobileOpen) && (
            <span className="text-base font-semibold tracking-tight text-neutral-900">
              {brand.name}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCloseAction}
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 md:hidden"
            aria-label="Đóng menu"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 md:flex"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      <Separator className="shrink-0" />

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-3">
        {filteredNav.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const label = item.sidebarLabel ?? item.name;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onCloseAction}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-neutral-600 hover:bg-primary-light hover:text-primary",
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {(!collapsed || mobileOpen) && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator className="shrink-0" />

      <div className="shrink-0 space-y-1 p-3">
        <Link
          href="/profile"
          onClick={onCloseAction}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-neutral-100",
            collapsed && !mobileOpen && "justify-center px-0",
          )}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-neutral-200 text-xs font-medium text-neutral-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          {(!collapsed || mobileOpen) && (
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-neutral-900">
                {profile?.full_name || "User"}
              </p>
              <p className="text-xs text-neutral-500">{roleLabel || roleName || ""}</p>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => {
            onCloseAction?.();
            handleSignOut();
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
            collapsed && !mobileOpen && "justify-center px-0",
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {(!collapsed || mobileOpen) && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          onClick={onCloseAction}
          className="fixed inset-0 z-[55] bg-black/50 md:hidden"
          aria-label="Đóng menu"
        />
      )}
      {sidebarContent}
    </>
  );
}
