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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Download, DollarSign, Users, TrendingUp, Lock, Unlock, CheckCircle, Pencil, StickyNote } from "lucide-react";
import LoadingBars from "@/components/ui/loading-bars";
import { HeaderActions } from "@/components/layout/header-actions";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SalaryRow = {
  employee_id: string;
  employee_code: string;
  full_name: string;
  employment_type: string;
  salary_amount: number;
  total_days: number;
  bonus: number;
  total_salary: number;
  note: string;
};

export default function SalaryReportPage() {
  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);

  // Confirm modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUnfinalize, setShowUnfinalize] = useState(false);
  const [unfinalizing, setUnfinalizing] = useState(false);

  // Modal state
  const [editRow, setEditRow] = useState<SalaryRow | null>(null);
  const [editBonus, setEditBonus] = useState("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month, year });
    const res = await fetch(`/api/reports/salary?${params}`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows ?? []);
      setFinalized(data.finalized ?? false);
    }
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  }

  function exportCSV() {
    const headers = ["Họ tên", "Loại", "Lương cơ bản", "Ngày công", "Thưởng/Phạt", "Ghi chú", "Tổng lương"];
    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.full_name,
          r.employment_type === "part_time" ? "Bán thời gian" : "Toàn thời gian",
          r.salary_amount,
          r.total_days,
          r.bonus,
          `"${(r.note || "").replace(/"/g, '""')}"`,
          Math.round(r.total_salary + r.bonus),
        ].join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-luong-${month}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFinalize() {
    setShowConfirm(false);
    setFinalizing(true);
    const res = await fetch("/api/reports/salary/finalize", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: parseInt(month), year: parseInt(year), rows }),
    });
    if (res.ok) {
      setFinalized(true);
      fetchReport();
    } else {
      const data = await res.json();
      alert(data.error || "Có lỗi xảy ra");
    }
    setFinalizing(false);
  }

  async function handleUnfinalize() {
    setShowUnfinalize(false);
    setUnfinalizing(true);
    const res = await fetch("/api/reports/salary/finalize", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: parseInt(month), year: parseInt(year) }),
    });
    if (res.ok) {
      setFinalized(false);
      fetchReport();
    } else {
      const data = await res.json();
      alert(data.error || "Có lỗi xảy ra");
    }
    setUnfinalizing(false);
  }

  function openEditModal(row: SalaryRow) {
    setEditRow(row);
    setEditBonus(String(row.bonus || ""));
    setEditNote(row.note || "");
  }

  async function handleSaveEdit() {
    if (!editRow) return;
    setSaving(true);

    if (finalized) {
      // Update in salary_records via API
      const res = await fetch("/api/reports/salary/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: editRow.employee_id,
          month: parseInt(month),
          year: parseInt(year),
          bonus: parseFloat(editBonus) || 0,
          note: editNote,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Có lỗi xảy ra");
        setSaving(false);
        return;
      }
      fetchReport();
    } else {
      // Update local state only (not finalized yet)
      setRows((prev) =>
        prev.map((r) =>
          r.employee_id === editRow.employee_id
            ? { ...r, bonus: parseFloat(editBonus) || 0, note: editNote }
            : r,
        ),
      );
    }

    setEditRow(null);
    setSaving(false);
  }

  const totalPayroll = rows.reduce((sum, r) => sum + r.total_salary, 0);
  const totalBonus = rows.reduce((sum, r) => sum + r.bonus, 0);
  const avgDays =
    rows.length > 0
      ? rows.reduce((sum, r) => sum + r.total_days, 0) / rows.length
      : 0;

  const currentYear = now.getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      <HeaderActions>
        {!finalized && rows.length > 0 && (
          <Button size="sm" onClick={() => setShowConfirm(true)} disabled={finalizing}>
            <Lock className="mr-2 h-4 w-4" />
            {finalizing ? "Đang chốt..." : "Chốt lương"}
          </Button>
        )}
        {finalized && (
          <Button size="sm" variant="outline" onClick={() => setShowUnfinalize(true)} disabled={unfinalizing} className="text-red-600 border-red-200 hover:bg-red-50">
            <Unlock className="mr-2 h-4 w-4" />
            {unfinalizing ? "Đang huỷ..." : "Huỷ chốt"}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={exportCSV} disabled={rows.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Xuất CSV
        </Button>
      </HeaderActions>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">Tháng</label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  Tháng {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">Năm</label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {finalized && (
          <Badge variant="outline" className="mb-1 bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Đã chốt lương
          </Badge>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Tổng chi phí lương
            </CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPayroll + totalBonus)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Số nhân viên
            </CardTitle>
            <Users className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
          </CardContent>
        </Card>

      </div>

      {/* Table */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Họ tên</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead className="text-right">Lương cơ bản</TableHead>
              <TableHead className="text-right">Ngày công</TableHead>
              <TableHead className="text-right">Thưởng/Phạt</TableHead>
              <TableHead className="text-right">Tổng lương</TableHead>
              <TableHead className="w-[50px]" />
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
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rows.map((r) => (
                  <TableRow key={r.employee_id}>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {r.employment_type === "part_time" ? "Bán thời gian" : "Toàn thời gian"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(r.salary_amount)}/{r.employment_type === "part_time" ? "Ca" : "Tháng"}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.total_days}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={r.bonus < 0 ? "text-red-600" : r.bonus > 0 ? "text-emerald-600" : ""}>
                          {r.bonus ? formatCurrency(r.bonus) : "—"}
                        </span>
                        {r.note && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <StickyNote className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[240px]">
                                <p className="text-xs">{r.note}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(r.total_salary + r.bonus)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditModal(r)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-neutral-50 font-medium">
                  <TableCell colSpan={3}>Tổng cộng</TableCell>
                  <TableCell className="text-right">
                    {rows.reduce((s, r) => s + r.total_days, 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {totalBonus ? formatCurrency(totalBonus) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totalPayroll + totalBonus)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editRow} onOpenChange={(open) => !open && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa - {editRow?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Thưởng/Phạt (VNĐ)</label>
              <Input
                type="number"
                value={editBonus}
                onChange={(e) => setEditBonus(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Ghi chú</label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Ghi chú..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Finalize Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận chốt lương</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-600">
            Bạn có chắc muốn chốt lương <span className="font-medium">Tháng {month}/{year}</span> cho{" "}
            <span className="font-medium">{rows.length} nhân viên</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Hủy
            </Button>
            <Button onClick={handleFinalize} disabled={finalizing}>
              {finalizing ? "Đang chốt..." : "Xác nhận chốt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Confirm Unfinalize Modal */}
      <Dialog open={showUnfinalize} onOpenChange={setShowUnfinalize}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận huỷ chốt lương</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-600">
            Bạn có chắc muốn huỷ chốt lương <span className="font-medium">Tháng {month}/{year}</span>?
            Dữ liệu đã chốt sẽ bị xoá và sẽ quay về dữ liệu thực tế.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnfinalize(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleUnfinalize} disabled={unfinalizing}>
              {unfinalizing ? "Đang huỷ..." : "Xác nhận huỷ chốt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
