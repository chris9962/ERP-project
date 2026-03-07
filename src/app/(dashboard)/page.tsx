"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, ChevronRight, ArrowLeft, LayoutGrid } from "lucide-react";
import {
  getHomeGroupPages,
  type PageConfig,
} from "@/lib/navigation";

type GroupId = "nhan-vien" | "he-thong" | null;

export default function HomePage() {
  const { profile, roleName } = useAuth();
  const [expandedGroup, setExpandedGroup] = useState<GroupId>(null);

  const nhanVienItems = getHomeGroupPages("nhan-vien", roleName);
  const heThongItems = getHomeGroupPages("he-thong", roleName);
  const canSeeNhanVien = nhanVienItems.length > 0;
  const canSeeHeThong = heThongItems.length > 0;

  return (
    <div className="space-y-6">
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
                <PageCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {expandedGroup === "he-thong" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {heThongItems.map((item) => (
                <PageCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PageCard({ item }: { item: PageConfig }) {
  const Icon = item.icon;
  return (
    <Link href={item.href}>
      <Card className="h-full cursor-pointer transition-all hover:shadow-md hover:border-neutral-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Icon className="h-5 w-5 text-neutral-500" />
            {item.name}
          </CardTitle>
          <ChevronRight className="h-5 w-5 text-neutral-400" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">{item.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
