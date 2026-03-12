"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import LoadingBars from "@/components/ui/loading-bars";
import { getSalaryLabel } from "@/lib/utils";
import { Pencil, User, FileDown } from "lucide-react";
import { HeaderActions, HeaderBack } from "@/components/layout/header-actions";
import AvatarUpload from "@/components/employees/avatar-upload";
import GenerateContractDialog from "@/components/contracts/generate-contract-dialog";

type Role = { id: string; name: string; label: string | null };
type Employee = {
  id: string;
  profile_id: string;
  employee_code: string | null;
  full_name: string | null;
  cccd_number: string | null;
  dob: string | null;
  address: string | null;
  gender: string | null;
  employment_type: string;
  status: string;
  start_date: string | null;
  department: string | null;
  salary_amount: number | null;
  avatar_url: string | null;
  contract_extra_data: Record<string, string> | null;
  profiles: { full_name: string | null; email: string | null; role_id: string | null; roles: { name: string; label: string | null } | null } | null;
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCccd, setFormCccd] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formGender, setFormGender] = useState("");
  const [formDept, setFormDept] = useState("");
  const [formType, setFormType] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [formSalary, setFormSalary] = useState("");
  const [formAvatarUrl, setFormAvatarUrl] = useState("");
  const [formRoleId, setFormRoleId] = useState("");
  const [contractDialogOpen, setContractDialogOpen] = useState(false);

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
      setFormDob(emp.dob || "");
      setFormAddress(emp.address || "");
      setFormGender(emp.gender || "");
      setFormDept(emp.department || "");
      setFormType(emp.employment_type);
      setFormStatus(emp.status);
      setFormSalary(String(emp.salary_amount || 0));
      setFormAvatarUrl(emp.avatar_url || "");
      setFormRoleId(emp.profiles?.role_id || "");
    }
    setRoles(data.roles ?? []);
    setAttendance(data.attendance ?? []);
    setLeaveBalance(data.leaveBalance ?? 0);
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
        dob: formDob || null,
        address: formAddress || null,
        gender: formGender || null,
        department: formDept || null,
        employment_type: formType,
        status: formStatus,
        salary_amount: formSalary,
        avatar_url: formAvatarUrl || null,
        role_id: formRoleId || null,
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
    active: "Đang làm",
    inactive: "Tạm nghỉ",
    resigned: "Đã nghỉ",
  };

  const valueLabels: Record<number, string> = {
    0: "Vắng",
    0.5: "Nửa ngày",
    1: "Đủ ngày",
    1.5: "Tăng ca",
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center py-20">
        <LoadingBars message="Đang tải..." />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-400">
        Không tìm thấy nhân viên
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderBack href="/employees" />
      <HeaderActions>
        {!editing ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setContractDialogOpen(true)}>
              <FileDown className="h-4 w-4" />
              <span className="hidden ml-2 md:block">Xuất hợp đồng</span>
            </Button>
            <Button size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              <span className="hidden ml-2 md:block">Chỉnh sửa</span>
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Hủy
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        )}
      </HeaderActions>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="attendance">Điểm danh</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {editing ? (
                <div className="mb-5">
                  <AvatarUpload
                    currentUrl={formAvatarUrl || null}
                    onUploaded={(url) => setFormAvatarUrl(url)}
                    onRemoved={() => setFormAvatarUrl("")}
                  />
                </div>
              ) : (
                <div className="mb-5 flex justify-center">
                  <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-neutral-200">
                    {employee.avatar_url ? (
                      <img
                        src={employee.avatar_url}
                        alt={employee.full_name || "Avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-neutral-100">
                        <User className="h-12 w-12 text-neutral-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mã nhân viên</Label>
                  <p className="text-sm font-mono">{employee.employee_code || "—"}</p>
                </div>
                <div className="space-y-2">
                  <Label>Họ và tên</Label>
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
                  <Label>Số CCCD</Label>
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
                  <Label>Ngày sinh</Label>
                  {editing ? (
                    <Input
                      type="date"
                      value={formDob}
                      onChange={(e) => setFormDob(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">
                      {employee.dob
                        ? new Date(employee.dob).toLocaleDateString("vi-VN")
                        : "—"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Giới tính</Label>
                  {editing ? (
                    <Select value={formGender} onValueChange={setFormGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nam">Nam</SelectItem>
                        <SelectItem value="Nữ">Nữ</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{employee.gender || "—"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm">
                    {employee.profiles?.email || "—"}
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Địa chỉ</Label>
                  {editing ? (
                    <Input
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="Địa chỉ thường trú"
                    />
                  ) : (
                    <p className="text-sm">{employee.address || "—"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Vai trò</Label>
                  {editing ? (
                    <Select value={formRoleId} onValueChange={setFormRoleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.label || r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">
                      {employee.profiles?.roles?.label || employee.profiles?.roles?.name || "—"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phòng ban</Label>
                  {editing ? (
                    <Input
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      placeholder="Nhập tên phòng ban"
                    />
                  ) : (
                    <p className="text-sm">
                      {employee.department || "—"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Loại nhân viên</Label>
                  {editing ? (
                    <Select value={formType} onValueChange={setFormType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">
                          Toàn thời gian
                        </SelectItem>
                        <SelectItem value="part_time">
                          Bán thời gian
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">
                      {employee.employment_type === "full_time"
                        ? "Toàn thời gian"
                        : "Bán thời gian"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    {getSalaryLabel(employee.employment_type)}
                  </Label>
                  {editing ? (
                    <Input
                      type="number"
                      value={formSalary}
                      onChange={(e) => setFormSalary(e.target.value)}
                      min="0"
                      step="1000"
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {formatCurrency(Number(employee.salary_amount) || 0)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  {editing ? (
                    <Select value={formStatus} onValueChange={setFormStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Đang làm</SelectItem>
                        <SelectItem value="inactive">Tạm nghỉ</SelectItem>
                        <SelectItem value="resigned">Đã nghỉ</SelectItem>
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
                  <Label>Ngày vào làm</Label>
                  <p className="text-sm">
                    {employee.start_date
                      ? new Date(employee.start_date).toLocaleDateString(
                        "vi-VN",
                      )
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">

          {employee.employment_type === "full_time" && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3">
              <span className="text-sm text-neutral-500">Ngày phép năm còn lại:</span>
              <span className={`text-lg font-bold ${leaveBalance <= 0 ? "text-red-500" : "text-emerald-600"}`}>
                {leaveBalance}
              </span>
              <span className="text-sm text-neutral-400">ngày</span>
            </div>
          )}

          <Card>
            <CardContent className="pt-6">
              {attendance.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">
                  Chưa có dữ liệu điểm danh
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Giá trị</TableHead>
                      <TableHead>Ghi chú</TableHead>
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

      <GenerateContractDialog
        open={contractDialogOpen}
        onOpenChange={setContractDialogOpen}
        employee={{
          id: employee.id,
          full_name: employee.full_name,
          cccd_number: employee.cccd_number,
          address: employee.address,
          department: employee.department,
          salary_amount: employee.salary_amount,
          dob: employee.dob,
          employment_type: employee.employment_type,
          role_label: employee.profiles?.roles?.label || employee.profiles?.roles?.name || null,
          contract_extra_data: employee.contract_extra_data,
        }}
      />
    </div>
  );
}
