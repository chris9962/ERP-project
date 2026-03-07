"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import LoadingBars from "@/components/ui/loading-bars";

type SalaryConfig = {
  id: string;
  employment_type: string;
  default_daily_rate: number;
  overtime_multiplier: number;
  created_at: string;
  updated_at: string;
};

export default function SalaryConfigPage() {
  const [configs, setConfigs] = useState<SalaryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryConfig | null>(null);
  const [formRate, setFormRate] = useState("");
  const [formMultiplier, setFormMultiplier] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchConfigs = useCallback(async () => {
    const res = await fetch("/api/salary-config", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setConfigs(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  function openEdit(config: SalaryConfig) {
    setEditing(config);
    setFormRate(String(config.default_daily_rate));
    setFormMultiplier(String(config.overtime_multiplier));
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setFormError("");
    setFormLoading(true);

    const rate = parseFloat(formRate);
    const multiplier = parseFloat(formMultiplier);

    if (isNaN(rate) || rate <= 0) {
      setFormError("Lương ngày không hợp lệ");
      setFormLoading(false);
      return;
    }
    if (isNaN(multiplier) || multiplier <= 0) {
      setFormError("Hệ số tăng ca không hợp lệ");
      setFormLoading(false);
      return;
    }

    const res = await fetch("/api/salary-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        default_daily_rate: rate,
        overtime_multiplier: multiplier,
      }),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json();
      setFormError("Lỗi: " + (data.error ?? res.statusText));
      setFormLoading(false);
      return;
    }

    setFormLoading(false);
    setDialogOpen(false);
    fetchConfigs();
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  }

  const typeLabels: Record<string, string> = {
    full_time: "Toàn thời gian",
    part_time: "Bán thời gian",
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loại nhân viên</TableHead>
              <TableHead>Lương ngày mặc định</TableHead>
              <TableHead>Hệ số tăng ca</TableHead>
              <TableHead>Cập nhật</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8">
                  <div className="flex justify-center">
                    <LoadingBars message="Đang tải..." />
                  </div>
                </TableCell>
              </TableRow>
            ) : configs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-neutral-400">
                  Chưa có cấu hình nào
                </TableCell>
              </TableRow>
            ) : (
              configs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">
                    {typeLabels[config.employment_type] ||
                      config.employment_type}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(config.default_daily_rate)}
                  </TableCell>
                  <TableCell>x{config.overtime_multiplier}</TableCell>
                  <TableCell className="text-neutral-500">
                    {new Date(config.updated_at).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(config)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Chỉnh sửa cấu hình -{" "}
              {editing
                ? typeLabels[editing.employment_type] || editing.employment_type
                : ""}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Lương ngày mặc định (VND)</Label>
              <Input
                type="number"
                value={formRate}
                onChange={(e) => setFormRate(e.target.value)}
                min="0"
                step="1000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Hệ số tăng ca</Label>
              <Input
                type="number"
                value={formMultiplier}
                onChange={(e) => setFormMultiplier(e.target.value)}
                min="0"
                step="0.1"
                required
              />
            </div>
            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "Đang xử lý..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
