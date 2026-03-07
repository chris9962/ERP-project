"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, ScanLine } from "lucide-react";
import Link from "next/link";
import { CCCDQRScanner } from "@/components/cccd-qr-scanner";

type Department = { id: string; name: string };

export default function NewEmployeePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form
  const [fullName, setFullName] = useState("");
  const [cccdNumber, setCccdNumber] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
        role_id: null, // Will set worker role
        role_name: "worker",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Lỗi khi tạo tài khoản");
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
        employee_code: employeeCode || null,
        department_id: departmentId || null,
        employment_type: employmentType,
        start_date: startDate,
        status: "active",
        salary_amount: salaryAmount || null,
        salary_reason: "Lương khởi điểm",
      }),
      credentials: "include",
    });

    if (!empRes.ok) {
      const data = await empRes.json();
      setError("Lỗi khi tạo nhân viên: " + (data.error ?? empRes.statusText));
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/employees");
  }

  function handleQrScanResult(data: { fullName: string; cccdNumber: string | null }) {
    setFullName(data.fullName);
    if (data.cccdNumber) setCccdNumber(data.cccdNumber);
    setScannerOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setScannerOpen(true)}
            >
              <ScanLine className="mr-2 h-4 w-4" />
              Quét CCCD
            </Button>
            <span className="text-sm text-neutral-500">
              Quét mã QR trên CCCD để điền sẵn Họ tên và Số CCCD
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Họ và tên *</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                    <Label>Phòng ban</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId}>
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
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@company.com"
                        required
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
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-5">
                  <div className="max-w-sm space-y-2">
                    <Label>Mức lương ban đầu (VND)</Label>
                    <Input
                      type="number"
                      value={salaryAmount}
                      onChange={(e) => setSalaryAmount(e.target.value)}
                      placeholder="10000000"
                      min="0"
                      step="100000"
                    />
                  </div>
                </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

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
