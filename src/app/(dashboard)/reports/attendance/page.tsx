"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, AlertTriangle, TrendingUp } from "lucide-react";
import LoadingBars from "@/components/ui/loading-bars";
import { HeaderActions } from "@/components/layout/header-actions";

type Department = { id: string; name: string };

type AttendanceRow = {
  employee_id: string;
  employee_code: string;
  full_name: string;
  department_name: string;
  total_days: number;
  absent_days: number;
  half_days: number;
  full_days: number;
  overtime_days: number;
};

function getFirstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}
function getLastDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
}

export default function AttendanceReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDept, setFilterDept] = useState("all");

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const [fromDate, setFromDate] = useState(() =>
    fromParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam) ? fromParam : getFirstDayOfMonth(),
  );
  const [toDate, setToDate] = useState(() =>
    toParam && /^\d{4}-\d{2}-\d{2}$/.test(toParam) ? toParam : getLastDayOfMonth(),
  );

  const fetchDepartments = useCallback(async () => {
    const res = await fetch("/api/departments", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setDepartments(data);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  async function fetchReport() {
    setLoading(true);
    const params = new URLSearchParams({
      from: fromDate,
      to: toDate,
      departmentId: filterDept,
    });
    const res = await fetch(`/api/reports/attendance?${params}`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setRows(data);
    }
    setLoading(false);
  }

  // Sync URL when from/to change (user picked new dates)
  const updateUrl = useCallback(
    (from: string, to: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", from);
      params.set("to", to);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Sync state from URL when navigating (e.g. from dashboard with ?from=&to=)
  useEffect(() => {
    if (fromParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam)) setFromDate(fromParam);
    if (toParam && /^\d{4}-\d{2}-\d{2}$/.test(toParam)) setToDate(toParam);
  }, [fromParam, toParam]);

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate, filterDept]);

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    updateUrl(value, toDate);
  };
  const handleToDateChange = (value: string) => {
    setToDate(value);
    updateUrl(fromDate, value);
  };

  const totalEmployees = rows.length;
  const avgDays =
    totalEmployees > 0
      ? rows.reduce((sum, r) => sum + r.total_days, 0) / totalEmployees
      : 0;
  const totalAbsent = rows.reduce((sum, r) => sum + r.absent_days, 0);

  // Top absent employees
  const topAbsent = [...rows]
    .sort((a, b) => b.absent_days - a.absent_days)
    .slice(0, 5)
    .filter((r) => r.absent_days > 0);

  return (
    <div className="space-y-6">
      <HeaderActions>
        <Button size="sm" onClick={fetchReport} disabled={loading}>
          {loading ? "Đang tải..." : "Xem báo cáo"}
        </Button>
      </HeaderActions>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">Từ ngày</label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => handleFromDateChange(e.target.value)}
            className="w-[170px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">Đến ngày</label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => handleToDateChange(e.target.value)}
            className="w-[170px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">
            Phòng ban
          </label>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Tổng nhân viên
            </CardTitle>
            <Users className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Ngày công TB
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDays.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Tổng ngày vắng
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAbsent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top absent */}
      {topAbsent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Nhân viên vắng nhiều nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {topAbsent.map((r) => (
                <Badge
                  key={r.employee_id}
                  variant="outline"
                  className="border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700"
                >
                  {r.full_name} — {r.absent_days} ngày vắng
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Họ tên</TableHead>
              <TableHead className="min-w-[100px]">Phòng ban</TableHead>
              <TableHead className="text-right">Nửa ngày</TableHead>
              <TableHead className="text-right">Đủ ngày</TableHead>
              <TableHead className="text-right">Tăng ca</TableHead>
              <TableHead className="text-right">Vắng</TableHead>
              <TableHead className="text-right">Tổng cộng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8">
                  <div className="flex justify-center">
                    <LoadingBars message="Đang tải..." />
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-neutral-400">
                  Không có dữ liệu. Nhấn &quot;Xem báo cáo&quot; để tải.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.employee_id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell className="text-neutral-500">
                    {r.department_name || "—"}
                  </TableCell>
                  <TableCell className="text-right">{r.half_days}</TableCell>
                  <TableCell className="text-right">{r.full_days}</TableCell>
                  <TableCell className="text-right">{r.overtime_days}</TableCell>
                  <TableCell className="text-right">
                    {r.absent_days > 0 ? (
                      <span className="text-amber-600">{r.absent_days}</span>
                    ) : (
                      r.absent_days
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {r.total_days}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
