"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Activity,
  Users,
  CalendarCheck,
  BarChart3,
  Settings,
  ChevronLeft,
  DollarSign,
  UserCog,
  Building2,
  X,
} from "lucide-react";

const navigation = [
  {
    name: "Trang chủ",
    href: "/",
    icon: LayoutDashboard,
    roles: ["admin", "owner", "manager", "office_staff", "worker"],
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Activity,
    roles: ["admin", "owner", "manager", "office_staff", "worker"],
  },
  {
    name: "Nhân viên",
    href: "/employees",
    icon: Users,
    roles: ["admin", "manager", "office_staff"],
  },
  {
    name: "Điểm danh",
    href: "/attendance",
    icon: CalendarCheck,
    roles: ["admin", "manager", "office_staff"],
  },
  // {
  //   name: "Báo cáo lương",
  //   href: "/reports/salary",
  //   icon: DollarSign,
  //   roles: ["admin", "owner"],
  // },
  // {
  //   name: "Báo cáo điểm danh",
  //   href: "/reports/attendance",
  //   icon: BarChart3,
  //   roles: ["admin", "owner"],
  // },
  {
    name: "Quản lý User",
    href: "/admin/users",
    icon: UserCog,
    roles: ["admin"],
  },
  {
    name: "Phòng ban",
    href: "/admin/departments",
    icon: Building2,
    roles: ["admin"],
  },
  // {
  //   name: "Cấu hình lương",
  //   href: "/admin/salary-config",
  //   icon: Settings,
  //   roles: ["admin"],
  // },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onCloseAction?: () => void;
};

export function Sidebar({ mobileOpen = false, onCloseAction }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { profile, roleName } = useAuth();
  const filteredNav = navigation.filter(
    (item) => roleName && item.roles.includes(roleName),
  );

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
        "flex h-screen flex-col border-r border-neutral-200 bg-white transition-all duration-300",
        "fixed inset-y-0 left-0 z-50 w-[260px] md:relative md:z-auto md:translate-x-0",
        "transform transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        collapsed ? "md:w-[68px]" : "md:w-[260px]",
      )}
    >
      {/* Logo + collapse / close */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={onCloseAction}>
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
            <Image
              src="/logo/logo.jpeg"
              alt="LegoFood"
              fill
              className="object-cover"
              sizes="32px"
              priority
            />
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="text-base font-semibold tracking-tight text-neutral-900">
              LegoFood
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

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1 px-3">
          {filteredNav.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseAction}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {(!collapsed || mobileOpen) && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User */}
      <div className="p-3">
        <Link
          href="/profile"
          onClick={onCloseAction}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-neutral-100",
            collapsed && !mobileOpen && "justify-center px-0",
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-neutral-200 text-xs font-medium text-neutral-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          {(!collapsed || mobileOpen) && (
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-neutral-900">
                {profile?.full_name || "User"}
              </p>
              <p className="text-xs text-neutral-500">{roleName || ""}</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Backdrop: mobile only, when open */}
      {mobileOpen && (
        <button
          type="button"
          onClick={onCloseAction}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="Đóng menu"
        />
      )}
      {sidebarContent}
    </>
  );
}
