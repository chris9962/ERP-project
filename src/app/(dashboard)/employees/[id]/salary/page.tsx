"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus } from "lucide-react";

type Employee = {
  id: string;
  full_name: string | null;
  employee_code: string | null;
};

type SalaryRecord = {
  id: string;
  salary_amount: number;
  effective_date: string;
  end_date: string | null;
  reason: string | null;
  created_at: string;
};

export default function EmployeeSalaryPage() {
  const params = useParams();
  const employeeId = params.id as string;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formReason, setFormReason] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/employees/${employeeId}/salary`, {
      credentials: "include",
    });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setEmployee(data.employee);
    setRecords(data.records ?? []);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      setFormError("Muc luong khong hop le");
      setFormLoading(false);
      return;
    }

    const currentRecord = records.find((r) => !r.end_date);
    let currentEndDate: string | null = null;
    if (currentRecord) {
      const endDate = new Date(formDate);
      endDate.setDate(endDate.getDate() - 1);
      currentEndDate = endDate.toISOString().split("T")[0];
    }

    const res = await fetch(`/api/employees/${employeeId}/salary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salary_amount: amount,
        effective_date: formDate,
        reason: formReason || null,
        current_record_id: currentRecord?.id ?? null,
        current_end_date: currentEndDate,
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
    setFormAmount("");
    setFormReason("");
    fetchData();
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  }

  const currentSalary = records.find((r) => !r.end_date);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-400">
        Dang tai...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/employees/${employeeId}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Quan ly luong
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {employee?.full_name || "N/A"} ({employee?.employee_code || "N/A"}
              )
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Cap nhat luong
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cap nhat muc luong</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Muc luong moi (VND)</Label>
                <Input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="10000000"
                  min="0"
                  step="100000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ngay ap dung</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ly do</Label>
                <Textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Ly do dieu chinh luong"
                  rows={3}
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
                  {formLoading ? "Dang xu ly..." : "Luu"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current salary */}
      {currentSalary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Luong hien tai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(currentSalary.salary_amount)}
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Ap dung tu{" "}
              {new Date(currentSalary.effective_date).toLocaleDateString(
                "vi-VN",
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lich su luong</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-400">
              Chua co lich su luong
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Muc luong</TableHead>
                  <TableHead>Tu ngay</TableHead>
                  <TableHead>Den ngay</TableHead>
                  <TableHead>Ly do</TableHead>
                  <TableHead>Ngay tao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {formatCurrency(r.salary_amount)}
                    </TableCell>
                    <TableCell>
                      {new Date(r.effective_date).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {r.end_date
                        ? new Date(r.end_date).toLocaleDateString("vi-VN")
                        : "Hien tai"}
                    </TableCell>
                    <TableCell className="text-neutral-500">
                      {r.reason || "—"}
                    </TableCell>
                    <TableCell className="text-neutral-500">
                      {new Date(r.created_at).toLocaleDateString("vi-VN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
