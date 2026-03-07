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
          Xin chao, {profile?.full_name || profile?.email || "User"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Nhan vien</CardTitle>
            <Users className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-neutral-500">Dang hoat dong</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Diem danh hom nay</CardTitle>
            <CalendarCheck className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0/0</div>
            <p className="text-xs text-neutral-500">Da diem danh</p>
          </CardContent>
        </Card>

        {(roleName === "admin" || roleName === "owner") && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Tong luong thang</CardTitle>
                <DollarSign className="h-4 w-4 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0 VND</div>
                <p className="text-xs text-neutral-500">Thang hien tai</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Phong ban</CardTitle>
                <Building2 className="h-4 w-4 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-neutral-500">Dang hoat dong</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
