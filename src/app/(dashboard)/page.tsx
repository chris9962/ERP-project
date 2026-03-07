"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Users,
  CalendarCheck,
  BarChart3,
  UserCog,
  Building2,
  ChevronRight,
  ArrowLeft,
  LayoutGrid,
} from "lucide-react";

type GroupId = "nhan-vien" | "he-thong" | null;

const NHAN_VIEN_ITEMS = [
  {
    name: "Điểm danh",
    href: "/attendance",
    icon: CalendarCheck,
    roles: ["admin", "manager", "office_staff"],
  },
  {
    name: "Quản lý nhân viên",
    href: "/employees",
    icon: Users,
    roles: ["admin", "manager", "office_staff"],
  },
  {
    name: "Báo cáo điểm danh",
    href: "/reports/attendance",
    icon: BarChart3,
    roles: ["admin", "owner"],
  },
] as const;

const HE_THONG_ITEMS = [
  { name: "Quản lý User", href: "/admin/users", icon: UserCog, roles: ["admin"] },
  { name: "Quản lý phòng ban", href: "/admin/departments", icon: Building2, roles: ["admin"] },
] as const;

function filterByRole<T extends { roles: readonly string[] }>(
  items: readonly T[],
  roleName: string | null,
) {
  if (!roleName) return [];
  return items.filter((item) => item.roles.includes(roleName));
}

export default function HomePage() {
  const { profile, roleName } = useAuth();
  const [expandedGroup, setExpandedGroup] = useState<GroupId>(null);

  const nhanVienItems = filterByRole(NHAN_VIEN_ITEMS, roleName);
  const heThongItems = filterByRole(HE_THONG_ITEMS, roleName);
  const canSeeNhanVien = nhanVienItems.length > 0;
  const canSeeHeThong = heThongItems.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trang chủ</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Xin chào, {profile?.full_name || profile?.email || "User"}
        </p>
      </div>

      {expandedGroup === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          {canSeeNhanVien && (
            <Card
              className="cursor-pointer transition-all hover:shadow-md hover:border-neutral-300"
              onClick={() => setExpandedGroup("nhan-vien")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Users className="h-5 w-5 text-neutral-500" />
                  Nhân viên
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-500">
                  Điểm danh, quản lý nhân viên, báo cáo điểm danh
                </p>
              </CardContent>
            </Card>
          )}
          {canSeeHeThong && (
            <Card
              className="cursor-pointer transition-all hover:shadow-md hover:border-neutral-300"
              onClick={() => setExpandedGroup("he-thong")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-neutral-500" />
                  Hệ thống
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-500">
                  Quản lý user, quản lý phòng ban
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          <button
            type="button"
            onClick={() => setExpandedGroup(null)}
            className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>

          {expandedGroup === "nhan-vien" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nhanVienItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card className="h-full cursor-pointer transition-all hover:shadow-md hover:border-neutral-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <item.icon className="h-5 w-5 text-neutral-500" />
                        {item.name}
                      </CardTitle>
                      <ChevronRight className="h-5 w-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-neutral-500">
                        {item.name === "Điểm danh" && "Chấm công theo ngày"}
                        {item.name === "Quản lý nhân viên" && "Danh sách, thêm/sửa nhân viên"}
                        {item.name === "Báo cáo điểm danh" && "Thống kê theo kỳ"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {expandedGroup === "he-thong" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {heThongItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card className="h-full cursor-pointer transition-all hover:shadow-md hover:border-neutral-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <item.icon className="h-5 w-5 text-neutral-500" />
                        {item.name}
                      </CardTitle>
                      <ChevronRight className="h-5 w-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-neutral-500">
                        {item.name === "Quản lý User" && "Tài khoản đăng nhập hệ thống"}
                        {item.name === "Quản lý phòng ban" && "Phòng ban, bộ phận"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
