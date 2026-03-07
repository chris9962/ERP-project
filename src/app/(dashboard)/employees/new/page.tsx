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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ScanLine } from "lucide-react";
import Link from "next/link";

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

  function handleQrScan() {
    // QR scan placeholder - would integrate camera API
    alert(
      "Tính năng scan QR CCCD sẽ được tích hợp sau. Hiện tại vui lòng nhập tay.",
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Thêm nhân viên
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Thêm nhân viên mới vào hệ thống
          </p>
        </div>
      </div>

      <Tabs defaultValue="manual" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="manual">Nhập tay</TabsTrigger>
          <TabsTrigger value="qr">Scan QR CCCD</TabsTrigger>
        </TabsList>

        <TabsContent value="qr">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scan QR trên CCCD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50">
                <div className="text-center">
                  <ScanLine className="mx-auto h-8 w-8 text-neutral-400" />
                  <p className="mt-2 text-sm text-neutral-500">
                    Nhấn vào để mở camera
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleQrScan}>
                <ScanLine className="mr-2 h-4 w-4" />
                Mở camera scan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardContent className="pt-6">
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
                    <Label>So CCCD</Label>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
