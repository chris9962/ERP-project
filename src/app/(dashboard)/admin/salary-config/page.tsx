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
      setFormError("Luong ngay khong hop le");
      setFormLoading(false);
      return;
    }
    if (isNaN(multiplier) || multiplier <= 0) {
      setFormError("He so tang ca khong hop le");
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
      setFormError("Loi: " + (data.error ?? res.statusText));
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
    full_time: "Toan thoi gian",
    part_time: "Ban thoi gian",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cau hinh luong
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Cau hinh muc luong mac dinh theo loai nhan vien
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loai nhan vien</TableHead>
              <TableHead>Luong ngay mac dinh</TableHead>
              <TableHead>He so tang ca</TableHead>
              <TableHead>Cap nhat</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-neutral-400">
                  Dang tai...
                </TableCell>
              </TableRow>
            ) : configs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-neutral-400">
                  Chua co cau hinh nao
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
              Chinh sua cau hinh -{" "}
              {editing
                ? typeLabels[editing.employment_type] || editing.employment_type
                : ""}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Luong ngay mac dinh (VND)</Label>
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
              <Label>He so tang ca</Label>
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
                Huy
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "Dang xu ly..." : "Cap nhat"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
