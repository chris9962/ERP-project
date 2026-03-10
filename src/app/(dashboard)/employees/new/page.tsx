"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScanLine } from "lucide-react";
import Link from "next/link";
import { CCCDQRScanner } from "@/components/cccd-qr-scanner";
import { HeaderActions, HeaderBack } from "@/components/layout/header-actions";
import AvatarUpload from "@/components/employees/avatar-upload";

function generateEmail(fullName: string): string {
  if (!fullName.trim()) return "";
  const prefix = process.env.NEXT_PUBLIC_COMPANY_EMAIL_PREFIX || "company";
  // Normalize Vietnamese characters to ASCII
  const normalized = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  // "Lê Vĩnh Phát" -> "legifood.phatlv@gmail.com"
  const firstName = parts[parts.length - 1];
  const lastNameInitials = parts.slice(0, -1).map((p) => p[0]).join("");
  return `${prefix}.${firstName}${lastNameInitials}@gmail.com`;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Form - pre-fill from URL params (from QR scan navigation)
  const [fullName, setFullName] = useState(searchParams.get("fullName") || "");
  const [cccdNumber, setCccdNumber] = useState(searchParams.get("cccd") || "");
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dob, setDob] = useState(() => {
    const d = searchParams.get("dob") || "";
    // Convert ddMMyyyy → yyyy-MM-dd nếu cần
    if (/^\d{8}$/.test(d)) return `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}`;
    return d;
  });
  const [address, setAddress] = useState(searchParams.get("address") || "");
  const [gender, setGender] = useState(searchParams.get("gender") || "");
  const [email, setEmail] = useState("");
  const [emailManual, setEmailManual] = useState(false);
  const [password, setPassword] = useState("");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [roleName, setRoleName] = useState("worker");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [roleOptions, setRoleOptions] = useState<{ name: string; label: string | null }[]>([]);

  useEffect(() => {
    fetch("/api/admin/roles", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRoleOptions(data));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // 1. Create user account
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        phone: "",
        role_id: null,
        role_name: roleName,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Lỗi khi tạo tài khoản");
      setLoading(false);
      return;
    }

    const { userId } = await res.json();

    const empRes = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_id: userId,
        full_name: fullName,
        cccd_number: cccdNumber || null,
        dob: dob || null,
        address: address || null,
        gender: gender || null,
        employee_code: employeeCode || null,
        department: department || null,
        employment_type: employmentType,
        start_date: startDate,
        status: "active",
        salary_amount: salaryAmount || 0,
        avatar_url: avatarUrl || null,
      }),
      credentials: "include",
    });

    if (!empRes.ok) {
      const data = await empRes.json();
      toast.error("Lỗi khi tạo nhân viên: " + (data.error ?? empRes.statusText));
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/employees");
  }

  function handleQrScanResult(data: { fullName: string; cccdNumber: string | null; dob: string | null; address: string | null; gender: string | null }) {
    setFullName(data.fullName);
    if (!emailManual) setEmail(generateEmail(data.fullName));
    if (data.cccdNumber) setCccdNumber(data.cccdNumber);
    if (data.dob) {
      // Convert from ddMMyyyy to yyyy-MM-dd
      const d = data.dob;
      if (/^\d{8}$/.test(d)) {
        setDob(`${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}`);
      } else {
        setDob(d);
      }
    }
    if (data.address) setAddress(data.address);
    if (data.gender) setGender(data.gender);
    setScannerOpen(false);
  }

  return (
    <div className="space-y-6">
      <HeaderBack href="/employees" />
      <HeaderActions>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setScannerOpen(true)}
        >
          <ScanLine className="mr-2 h-4 w-4" />
          Quét CCCD
        </Button>
      </HeaderActions>

      <Card className="max-w-2xl">
        <CardContent className="pt-6">

          <form onSubmit={handleSubmit} className="space-y-5">
            <AvatarUpload
              currentUrl={null}
              onUploaded={(url) => setAvatarUrl(url)}
              onRemoved={() => setAvatarUrl("")}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Họ và tên *</Label>
                <Input
                  value={fullName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFullName(name);
                    if (!emailManual) setEmail(generateEmail(name));
                  }}
                  placeholder="Nguyen Van A"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Số CCCD</Label>
                <Input
                  value={cccdNumber}
                  onChange={(e) => setCccdNumber(e.target.value)}
                  placeholder="012345678901"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ngày sinh</Label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Giới tính</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
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
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Địa chỉ thường trú"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Vai trò</Label>
                <Select value={roleName} onValueChange={setRoleName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r.name} value={r.name}>
                        {r.label || r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phòng ban</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Nhập tên phòng ban"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Loại nhân viên</Label>
                <Select
                  value={employmentType}
                  onValueChange={setEmploymentType}
                >
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
                <Label>Ngày vào làm</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-5">
              <p className="mb-3 text-sm font-medium text-neutral-700">
                Tài khoản đăng nhập
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onFocus={() => setEmailManual(true)}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@company.com"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mật khẩu *</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-5">
              <div className="max-w-sm space-y-2">
                <Label>
                  {employmentType === "part_time"
                    ? "Mức lương ban đầu theo ca (VND) *"
                    : "Mức lương ban đầu theo tháng (VND) *"}
                </Label>
                <Input
                  type="number"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                  placeholder="10000000"
                  min="0"
                  step="1000"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Đang tạo..." : "Tạo nhân viên"}
              </Button>
              <Link href="/employees">
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <CCCDQRScanner
        open={scannerOpen}
        onCloseAction={() => setScannerOpen(false)}
        onScanAction={handleQrScanResult}
      />
    </div>
  );
}
