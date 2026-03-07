"use client";

import { useEffect, useState, useCallback } from "react";
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
import { CalendarCheck, Users, AlertTriangle, TrendingUp } from "lucide-react";

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

export default function AttendanceReportPage() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDept, setFilterDept] = useState("all");

  const now = new Date();
  const [fromDate, setFromDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
  );
  const [toDate, setToDate] = useState(
    new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
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

  useEffect(() => {
    fetchReport();
  }, []);

  const totalEmployees = rows.length;
  const avgDays =
    totalEmployees > 0
      ? rows.reduce((sum, r) => sum + r.total_days, 0) / totalEmployees
      : 0;
  const totalAbsent = rows.reduce((sum, r) => sum + r.absent_days, 0);
  const attendanceRate =
    totalEmployees > 0
      ? (
          (rows.filter((r) => r.total_days > 0).length / totalEmployees) *
          100
        ).toFixed(1)
      : "0";

  // Top absent employees
  const topAbsent = [...rows]
    .sort((a, b) => b.absent_days - a.absent_days)
    .slice(0, 5)
    .filter((r) => r.absent_days > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bao cao diem danh
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Thong ke diem danh nhan vien theo ky
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">Tu ngay</label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-[170px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">Den ngay</label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-[170px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">
            Phong ban
          </label>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tat ca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tat ca phong ban</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchReport} disabled={loading}>
          {loading ? "Dang tai..." : "Xem bao cao"}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Tong nhan vien
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
              Ngay cong TB
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
              Ti le di lam
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Tong ngay vang
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
              Nhan vien vang nhieu nhat
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
                  {r.full_name} — {r.absent_days} ngay vang
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
              <TableHead>Ma NV</TableHead>
              <TableHead>Ho ten</TableHead>
              <TableHead>Phong ban</TableHead>
              <TableHead className="text-right">Nua ngay</TableHead>
              <TableHead className="text-right">Du ngay</TableHead>
              <TableHead className="text-right">Tang ca</TableHead>
              <TableHead className="text-right">Vang</TableHead>
              <TableHead className="text-right">Tong cong</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-neutral-400">
                  Dang tai...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-neutral-400">
                  Khong co du lieu. Nhan &quot;Xem bao cao&quot; de tai.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.employee_id}>
                  <TableCell className="font-mono text-sm">
                    {r.employee_code || "—"}
                  </TableCell>
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
