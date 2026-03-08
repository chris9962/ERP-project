"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import LoadingBars from "@/components/ui/loading-bars";

type Department = { id: string; name: string };

type EmployeeFull = {
  id: string;
  profile_id: string;
  employee_code: string | null;
  full_name: string | null;
  cccd_number: string | null;
  employment_type: string;
  status: string;
  start_date: string | null;
  department_id: string | null;
  salary_amount: number | null;
  departments: { name: string } | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    role_id: string | null;
    roles: { name: string } | null;
  } | null;
};

type Props = {
  employeeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export default function QuickEditModal({
  employeeId,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<EmployeeFull | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [formName, setFormName] = useState("");
  const [formCccd, setFormCccd] = useState("");
  const [formDeptId, setFormDeptId] = useState("");
  const [formType, setFormType] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [formSalary, setFormSalary] = useState("");

  useEffect(() => {
    if (!open || !employeeId) return;
    setLoading(true);
    setEmployee(null);
    fetch(`/api/employees/${employeeId}/full`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const emp = data.employee as EmployeeFull;
        setEmployee(emp);
        setDepartments(data.departments ?? []);
        setFormName(emp.full_name || "");
        setFormCccd(emp.cccd_number || "");
        setFormDeptId(emp.department_id || "");
        setFormType(emp.employment_type);
        setFormStatus(emp.status);
        setFormSalary(String(emp.salary_amount || 0));
      })
      .finally(() => setLoading(false));
  }, [open, employeeId]);

  async function handleSave() {
    if (!employee) return;
    setSaving(true);
    const res = await fetch(`/api/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: formName,
        cccd_number: formCccd || null,
        department_id: formDeptId || null,
        employment_type: formType,
        status: formStatus,
        salary_amount: formSalary,
      }),
      credentials: "include",
    });
    setSaving(false);
    if (res.ok) {
      onOpenChange(false);
      onSaved();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa nhân viên</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingBars message="Đang tải..." />
          </div>
        ) : employee ? (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Mã nhân viên</Label>
              <p className="text-sm font-mono">
                {employee.employee_code || "—"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Họ và tên</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Số CCCD</Label>
              <Input
                value={formCccd}
                onChange={(e) => setFormCccd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phòng ban</Label>
              <Select value={formDeptId} onValueChange={setFormDeptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại nhân viên</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Toàn thời gian</SelectItem>
                    <SelectItem value="part_time">Bán thời gian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
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
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                {formType === "part_time"
                  ? "Lương theo ca (VND)"
                  : "Lương tháng (VND)"}
              </Label>
              <Input
                type="number"
                value={formSalary}
                onChange={(e) => setFormSalary(e.target.value)}
                min="0"
                step="1000"
              />
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
