"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, Pencil, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import LoadingBars from "@/components/ui/loading-bars";
import { HeaderActions } from "@/components/layout/header-actions";
import QuickEditModal from "@/components/employees/quick-edit-modal";

type Employee = {
  id: string;
  employee_code: string | null;
  full_name: string | null;
  employment_type: string;
  status: string;
  start_date: string | null;
  avatar_url: string | null;
  department: string | null;
  profiles: { full_name: string | null; email: string | null; roles: { name: string } | null } | null;
  salary_amount: number | null;
};


export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [sortKey, setSortKey] = useState<"full_name" | "department" | "salary">("full_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Quick edit modal
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/employees", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setEmployees(data as Employee[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openEdit(id: string) {
    setEditId(id);
    setEditOpen(true);
  }

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ column }: { column: typeof sortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-neutral-300" />;
    return sortDir === "asc"
      ? <ArrowUp className="ml-1 inline h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 inline h-3.5 w-3.5" />;
  }

  const filtered = employees
    .filter((emp) => {
      const name = emp.full_name || emp.profiles?.full_name || "";
      const code = emp.employee_code || "";
      const matchSearch =
        !search ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        code.toLowerCase().includes(search.toLowerCase());
      const matchDept =
        filterDept === "all" || emp.employment_type === filterDept;
      const matchStatus = filterStatus === "all" || emp.status === filterStatus;
      return matchSearch && matchDept && matchStatus;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "full_name") {
        const na = a.full_name || a.profiles?.full_name || "";
        const nb = b.full_name || b.profiles?.full_name || "";
        return dir * na.localeCompare(nb, "vi");
      }
      if (sortKey === "department") {
        return dir * (a.department ?? "").localeCompare(b.department ?? "", "vi");
      }
      // salary
      return dir * ((a.salary_amount ?? 0) - (b.salary_amount ?? 0));
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
              <SelectValue placeholder="Loại nhân viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="full_time">Toàn thời gian</SelectItem>
              <SelectItem value="part_time">Bán thời gian</SelectItem>
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
              <TableHead className="min-w-[180px] cursor-pointer select-none" onClick={() => toggleSort("full_name")}>
                Họ tên <SortIcon column="full_name" />
              </TableHead>
              <TableHead className="min-w-[100px] cursor-pointer select-none" onClick={() => toggleSort("department")}>
                Phòng ban <SortIcon column="department" />
              </TableHead>
              <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("salary")}>
                Lương <SortIcon column="salary" />
              </TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8">
                  <div className="flex justify-center">
                    <LoadingBars message="Đang tải..." />
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-neutral-400">
                  Không có nhân viên nào
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => openEdit(emp.id)}
                      className="flex items-center gap-3 text-left hover:underline cursor-pointer"
                    >
                      {emp.avatar_url ? (
                        <img
                          src={emp.avatar_url}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium text-neutral-500">
                          {(emp.full_name || "?")[0]}
                        </div>
                      )}
                      <span className="font-medium">
                        {emp.full_name || emp.profiles?.full_name || "—"}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {emp.department || "—"}
                  </TableCell>
                  <TableCell className="text-right text-neutral-600">
                    {emp.salary_amount
                      ? `${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(emp.salary_amount)}/${emp.employment_type === "part_time" ? "Ca" : "Tháng"}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Link href={`/employees/${emp.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <QuickEditModal
        employeeId={editId}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={fetchData}
      />
    </div>
  );
}
