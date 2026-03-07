"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, DollarSign, Pencil } from "lucide-react";

type Department = { id: string; name: string };
type Employee = {
  id: string;
  profile_id: string;
  employee_code: string | null;
  full_name: string | null;
  cccd_number: string | null;
  employment_type: string;
  status: string;
  start_date: string | null;
  department_id: string | null;
  departments: { name: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
};
type SalaryRecord = {
  id: string;
  salary_amount: number;
  effective_date: string;
  end_date: string | null;
  reason: string | null;
  created_at: string;
};
type AttendanceRecord = {
  id: string;
  date: string;
  value: number;
  note: string | null;
};

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<SalaryRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCccd, setFormCccd] = useState("");
  const [formDeptId, setFormDeptId] = useState("");
  const [formType, setFormType] = useState("");
  const [formStatus, setFormStatus] = useState("");

  const fetchFull = useCallback(async () => {
    const res = await fetch(`/api/employees/${id}/full`, { credentials: "include" });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    const emp = data.employee as Employee;
    if (emp) {
      setEmployee(emp);
      setFormName(emp.full_name || "");
      setFormCode(emp.employee_code || "");
      setFormCccd(emp.cccd_number || "");
      setFormDeptId(emp.department_id || "");
      setFormType(emp.employment_type);
      setFormStatus(emp.status);
    }
    setDepartments(data.departments ?? []);
    setSalaryHistory(data.salaryHistory ?? []);
    setAttendance(data.attendance ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchFull();
  }, [fetchFull]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: formName,
        employee_code: formCode || null,
        cccd_number: formCccd || null,
        department_id: formDeptId || null,
        employment_type: formType,
        status: formStatus,
      }),
      credentials: "include",
    });
    setSaving(false);
    setEditing(false);
    if (res.ok) fetchFull();
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-amber-50 text-amber-700 border-amber-200",
    resigned: "bg-neutral-100 text-neutral-500 border-neutral-200",
  };

  const statusLabels: Record<string, string> = {
    active: "Dang lam",
    inactive: "Tam nghi",
    resigned: "Da nghi",
  };

  const valueLabels: Record<number, string> = {
    0: "Vang",
    0.5: "Nua ngay",
    1: "Du ngay",
    1.5: "Tang ca",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-400">
        Dang tai...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-400">
        Khong tim thay nhan vien
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {employee.full_name || employee.profiles?.full_name || "N/A"}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-neutral-500">
                {employee.employee_code || "Chua co ma NV"}
              </span>
              <Badge
                variant="outline"
                className={statusColors[employee.status] || ""}
              >
                {statusLabels[employee.status] || employee.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/employees/${id}/salary`}>
            <Button variant="outline">
              <DollarSign className="mr-2 h-4 w-4" />
              Quan ly luong
            </Button>
          </Link>
          {!editing ? (
            <Button onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Chinh sua
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>
                Huy
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Dang luu..." : "Luu"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Thong tin</TabsTrigger>
          <TabsTrigger value="salary">Lich su luong</TabsTrigger>
          <TabsTrigger value="attendance">Diem danh</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ho va ten</Label>
                  {editing ? (
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">{employee.full_name || "—"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Ma nhan vien</Label>
                  {editing ? (
                    <Input
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                    />
                  ) : (
                    <p className="font-mono text-sm">
                      {employee.employee_code || "—"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>So CCCD</Label>
                  {editing ? (
                    <Input
                      value={formCccd}
                      onChange={(e) => setFormCccd(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">{employee.cccd_number || "—"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phong ban</Label>
                  {editing ? (
                    <Select value={formDeptId} onValueChange={setFormDeptId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chon phong ban" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">
                      {(employee.departments as { name: string } | null)
                        ?.name || "—"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Loai nhan vien</Label>
                  {editing ? (
                    <Select value={formType} onValueChange={setFormType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">
                          Toan thoi gian
                        </SelectItem>
                        <SelectItem value="part_time">
                          Ban thoi gian
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">
                      {employee.employment_type === "full_time"
                        ? "Toan thoi gian"
                        : "Ban thoi gian"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Trang thai</Label>
                  {editing ? (
                    <Select value={formStatus} onValueChange={setFormStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Dang lam</SelectItem>
                        <SelectItem value="inactive">Tam nghi</SelectItem>
                        <SelectItem value="resigned">Da nghi</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="outline"
                      className={statusColors[employee.status] || ""}
                    >
                      {statusLabels[employee.status] || employee.status}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Ngay vao lam</Label>
                  <p className="text-sm">
                    {employee.start_date
                      ? new Date(employee.start_date).toLocaleDateString(
                          "vi-VN",
                        )
                      : "—"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm">
                    {employee.profiles?.email || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Lich su luong</CardTitle>
              <Link href={`/employees/${id}/salary`}>
                <Button size="sm" variant="outline">
                  Cap nhat luong
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {salaryHistory.length === 0 ? (
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryHistory.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {formatCurrency(s.salary_amount)}
                        </TableCell>
                        <TableCell>
                          {new Date(s.effective_date).toLocaleDateString(
                            "vi-VN",
                          )}
                        </TableCell>
                        <TableCell>
                          {s.end_date
                            ? new Date(s.end_date).toLocaleDateString("vi-VN")
                            : "Hien tai"}
                        </TableCell>
                        <TableCell className="text-neutral-500">
                          {s.reason || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Lich su diem danh (30 ngay gan nhat)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">
                  Chua co du lieu diem danh
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngay</TableHead>
                      <TableHead>Gia tri</TableHead>
                      <TableHead>Ghi chu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          {new Date(a.date).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {valueLabels[a.value] ?? a.value}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-neutral-500">
                          {a.note || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
