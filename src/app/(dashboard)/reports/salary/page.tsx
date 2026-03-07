"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Download, DollarSign, Users, TrendingUp } from "lucide-react";

type Department = { id: string; name: string };

type SalaryRow = {
  employee_id: string;
  employee_code: string;
  full_name: string;
  department_name: string;
  salary_amount: number;
  total_days: number;
  total_salary: number;
};

export default function SalaryReportPage() {
  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDept, setFilterDept] = useState("all");

  // Default: current month
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
    const res = await fetch(`/api/reports/salary?${params}`, {
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

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  }

  function exportCSV() {
    const headers = [
      "Ma NV",
      "Ho ten",
      "Phong ban",
      "Luong co ban",
      "Ngay cong",
      "Tong luong",
    ];
    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.employee_code,
          r.full_name,
          r.department_name,
          r.salary_amount,
          r.total_days,
          Math.round(r.total_salary),
        ].join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-luong-${fromDate}-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPayroll = rows.reduce((sum, r) => sum + r.total_salary, 0);
  const avgDays =
    rows.length > 0
      ? rows.reduce((sum, r) => sum + r.total_days, 0) / rows.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bao cao luong
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Thong ke luong nhan vien theo ky
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={rows.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Xuat CSV
        </Button>
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Tong chi phi luong
            </CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPayroll)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              So nhan vien
            </CardTitle>
            <Users className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
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
      </div>

      {/* Table */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ma NV</TableHead>
              <TableHead>Ho ten</TableHead>
              <TableHead>Phong ban</TableHead>
              <TableHead className="text-right">Luong co ban</TableHead>
              <TableHead className="text-right">Ngay cong</TableHead>
              <TableHead className="text-right">Tong luong</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-neutral-400">
                  Dang tai...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-neutral-400">
                  Khong co du lieu. Nhan &quot;Xem bao cao&quot; de tai.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rows.map((r) => (
                  <TableRow key={r.employee_id}>
                    <TableCell className="font-mono text-sm">
                      {r.employee_code || "—"}
                    </TableCell>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell className="text-neutral-500">
                      {r.department_name || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(r.salary_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.total_days}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(r.total_salary)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-neutral-50 font-medium">
                  <TableCell colSpan={4}>Tong cong</TableCell>
                  <TableCell className="text-right">
                    {rows.reduce((s, r) => s + r.total_days, 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totalPayroll)}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
