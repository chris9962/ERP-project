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
    active: "Dang lam",
    inactive: "Tam nghi",
    resigned: "Da nghi",
  };

  const typeLabels: Record<string, string> = {
    full_time: "Toan thoi gian",
    part_time: "Ban thoi gian",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nhan vien</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Quan ly danh sach nhan vien
          </p>
        </div>
        <Link href="/employees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Them nhan vien
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Tim kiem ten, ma NV..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Phong ban" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca phong ban</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Trang thai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca</SelectItem>
            <SelectItem value="active">Dang lam</SelectItem>
            <SelectItem value="inactive">Tam nghi</SelectItem>
            <SelectItem value="resigned">Da nghi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ma NV</TableHead>
              <TableHead>Ho ten</TableHead>
              <TableHead>Phong ban</TableHead>
              <TableHead>Loai</TableHead>
              <TableHead>Trang thai</TableHead>
              <TableHead>Ngay vao lam</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-neutral-400">
                  Dang tai...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-neutral-400">
                  Khong co nhan vien nao
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-mono text-sm">
                    {emp.employee_code || "—"}
                  </TableCell>
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
