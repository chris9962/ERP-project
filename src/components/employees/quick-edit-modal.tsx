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
  dob: string | null;
  address: string | null;
  gender: string | null;
  employment_type: string;
  status: string;
  start_date: string | null;
  department_id: string | null;
  salary_amount: number | null;
  avatar_url: string | null;
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
  const [formDob, setFormDob] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formGender, setFormGender] = useState("");
  const [formDeptId, setFormDeptId] = useState("");
  const [formType, setFormType] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [formSalary, setFormSalary] = useState("");
  const [formAvatarUrl, setFormAvatarUrl] = useState("");

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
        setFormDob(emp.dob || "");
        setFormAddress(emp.address || "");
        setFormGender(emp.gender || "");
        setFormDeptId(emp.department_id || "");
        setFormType(emp.employment_type);
        setFormStatus(emp.status);
        setFormSalary(String(emp.salary_amount || 0));
        setFormAvatarUrl(emp.avatar_url || "");
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
        dob: formDob || null,
        address: formAddress || null,
        gender: formGender || null,
        department_id: formDeptId || null,
        employment_type: formType,
        status: formStatus,
        salary_amount: formSalary,
        avatar_url: formAvatarUrl || null,
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày sinh</Label>
                <Input
                  type="date"
                  value={formDob}
                  onChange={(e) => setFormDob(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Giới tính</Label>
                <Select value={formGender} onValueChange={setFormGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Địa chỉ thường trú"
              />
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
