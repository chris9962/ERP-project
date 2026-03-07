"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  Settings,
  ChevronLeft,
  Building2,
  DollarSign,
  UserCog,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "owner", "manager", "office_staff", "worker"],
  },
  {
    name: "Nhan vien",
    href: "/employees",
    icon: Users,
    roles: ["admin", "manager", "office_staff"],
  },
  {
    name: "Diem danh",
    href: "/attendance",
    icon: CalendarCheck,
    roles: ["admin", "manager", "office_staff"],
  },
  {
    name: "Bao cao luong",
    href: "/reports/salary",
    icon: DollarSign,
    roles: ["admin", "owner"],
  },
  {
    name: "Bao cao diem danh",
    href: "/reports/attendance",
    icon: BarChart3,
    roles: ["admin", "owner"],
  },
  {
    name: "Quan ly User",
    href: "/admin/users",
    icon: UserCog,
    roles: ["admin"],
  },
  {
    name: "Phong ban",
    href: "/admin/departments",
    icon: Building2,
    roles: ["admin"],
  },
  {
    name: "Cau hinh luong",
    href: "/admin/salary-config",
    icon: Settings,
    roles: ["admin"],
  },
];

export function Sidebar() {
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

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-neutral-200 bg-white transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight text-neutral-900">
              ERP System
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180",
            )}
          />
        </button>
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
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.name}</span>}
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
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-neutral-100",
            collapsed && "justify-center px-0",
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-neutral-200 text-xs font-medium text-neutral-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
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
}
