"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye } from "lucide-react";
import LoadingBars from "@/components/ui/loading-bars";
import { HeaderActions } from "@/components/layout/header-actions";

type Employee = {
  id: string;
  employee_code: string | null;
  full_name: string | null;
  employment_type: string;
  status: string;
  start_date: string | null;
  departments: { name: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

type Department = { id: string; name: string };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchData = useCallback(async () => {
    const [empRes, deptRes] = await Promise.all([
      fetch("/api/employees", { credentials: "include" }),
      fetch("/api/departments", { credentials: "include" }),
    ]);
    if (empRes.ok) {
      const data = await empRes.json();
      setEmployees(data as Employee[]);
    }
    if (deptRes.ok) {
      const data = await deptRes.json();
      setDepartments(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const typeLabels: Record<string, string> = {
    full_time: "Toàn thời gian",
    part_time: "Bán thời gian",
  };

  const filtered = employees.filter((emp) => {
    const name = emp.full_name || emp.profiles?.full_name || "";
    const code = emp.employee_code || "";
    const matchSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      code.toLowerCase().includes(search.toLowerCase());
    const matchDept =
      filterDept === "all" ||
      (emp.departments as { name: string } | null)?.name === filterDept;
    const matchStatus = filterStatus === "all" || emp.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div className="space-y-6">
      <HeaderActions>
        <Link href="/employees/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhân viên
          </Button>
        </Link>
      </HeaderActions>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <div className="relative sm:max-w-sm sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Tìm kiếm tên, mã NV..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="flex-1 sm:w-[180px]">
              <SelectValue placeholder="Phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 sm:w-[160px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang làm</SelectItem>
              <SelectItem value="inactive">Tạm nghỉ</SelectItem>
              <SelectItem value="resigned">Đã nghỉ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Họ tên</TableHead>
              <TableHead className="min-w-[100px]">Phòng ban</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày vào làm</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8">
                  <div className="flex justify-center">
                    <LoadingBars message="Đang tải..." />
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-neutral-400">
                  Không có nhân viên nào
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">
                    {emp.full_name || emp.profiles?.full_name || "—"}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {(emp.departments as { name: string } | null)?.name || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {typeLabels[emp.employment_type] || emp.employment_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[emp.status] || ""}
                    >
                      {statusLabels[emp.status] || emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {emp.start_date
                      ? new Date(emp.start_date).toLocaleDateString("vi-VN")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Link href={`/employees/${emp.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
