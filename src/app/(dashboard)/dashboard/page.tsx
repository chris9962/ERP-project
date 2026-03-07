"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, CalendarCheck, DollarSign, Building2 } from "lucide-react";

export default function DashboardPage() {
  const { profile, roleName } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Xin chào, {profile?.full_name || profile?.email || "User"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Nhân viên</CardTitle>
            <Users className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-neutral-500">Đang hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Điểm danh hôm nay</CardTitle>
            <CalendarCheck className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0/0</div>
            <p className="text-xs text-neutral-500">Đã điểm danh</p>
          </CardContent>
        </Card>

        {(roleName === "admin" || roleName === "owner") && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Tổng lương tháng</CardTitle>
                <DollarSign className="h-4 w-4 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0 VND</div>
                <p className="text-xs text-neutral-500">Tháng hiện tại</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Phòng ban</CardTitle>
                <Building2 className="h-4 w-4 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-neutral-500">Đang hoạt động</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
