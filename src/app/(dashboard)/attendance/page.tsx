"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
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
import { Save, CalendarCheck } from "lucide-react";
import LoadingBars from "@/components/ui/loading-bars";

type Employee = {
  id: string;
  employee_code: string | null;
  full_name: string | null;
  department_id: string | null;
  departments: { id: string; name: string } | null;
  status: string;
};

type AttendanceEntry = {
  employeeId: string;
  value: number | null;
  note: string;
  existing: boolean;
};

type Department = { id: string; name: string };

const NOTE_BY_LABEL = "Điểm danh bởi";

export default function AttendancePage() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterDept, setFilterDept] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSavedMsg("");
    const res = await fetch(`/api/attendance?date=${date}`, { credentials: "include" });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setEmployees((data.employees || []) as Employee[]);
    setDepartments(data.departments || []);
    const rawEntries = (data.entries || {}) as Record<string, AttendanceEntry>;
    const defaultNoteVal = `${NOTE_BY_LABEL} ${profile?.full_name || "User"}`;
    const entriesWithNote: Record<string, AttendanceEntry> = {};
    for (const [k, v] of Object.entries(rawEntries)) {
      entriesWithNote[k] = {
        ...v,
        employeeId: v.employeeId || k,
        note: v.note?.trim() ? v.note : defaultNoteVal,
      };
    }
    setEntries(entriesWithNote);
    setLoading(false);
  }, [date, profile?.full_name]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const defaultNote = `${NOTE_BY_LABEL} ${profile?.full_name || "User"}`;

  function updateValue(empId: string, value: number | null) {
    setEntries((prev) => {
      const current = prev[empId];
      const note = current?.note?.trim() ? current.note : defaultNote;
      return {
        ...prev,
        [empId]: { ...current, employeeId: empId, value, note },
      };
    });
  }

  function updateNote(empId: string, note: string) {
    setEntries((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], note },
    }));
  }

  async function handleSaveAll() {
    setSaving(true);
    setSavedMsg("");
    // Chỉ gửi nhân viên đã được chọn (đã điểm danh); bỏ qua chưa chọn (value === null)
    const entriesList = Object.values(entries)
      .filter((entry) => entry.value != null)
      .map((entry) => ({
        employeeId: entry.employeeId,
        value: entry.value as number,
        note: (entry.note?.trim() || defaultNote) || null,
      }));
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, entries: entriesList }),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json();
      setSavedMsg("Lỗi khi lưu: " + (data.error ?? res.statusText));
    } else {
      setSavedMsg("Đã lưu điểm danh thành công!");
      fetchData();
    }
    setSaving(false);
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      filterDept === "all" ||
      (emp.departments as { id: string } | null)?.id === filterDept,
  );

  const valueOptions = [
    { value: 0.5, label: "Nửa ngày" },
    { value: 1, label: "Đủ ngày" },
    { value: 1.5, label: "Tăng ca" },
    { value: 0, label: "Vắng" },
  ];

  const totalAttended = Object.values(entries).filter((e) => e.value != null && e.value > 0).length;
  const countByValue = valueOptions.reduce(
    (acc, opt) => {
      acc[opt.value] = Object.values(entries).filter((e) => e.value === opt.value).length;
      return acc;
    },
    {} as Record<number, number>,
  );
  const summaryLabels: Record<number, string> = {
    0.5: "ngày làm nửa ngày",
    1: "ngày đủ ngày",
    1.5: "tăng ca",
    0: "vắng",
  };
  const summaryParts = valueOptions
    .filter((opt) => countByValue[opt.value] > 0)
    .map((opt) => `${countByValue[opt.value]} ${summaryLabels[opt.value]}`);
  const summaryText = summaryParts.length > 0 ? summaryParts.join(" · ") : "Chưa điểm danh";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Điểm danh</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Điểm danh nhân viên theo ngày
          </p>
        </div>
        <Button onClick={handleSaveAll} disabled={saving || loading}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Đang lưu..." : "Lưu tất cả"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">Ngày</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">
            Phòng ban
          </label>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-end gap-3 pb-0.5">
          <Badge variant="outline" className="flex items-center gap-1.5 py-1.5">
            <CalendarCheck className="h-3.5 w-3.5" />
            {summaryText}
          </Badge>
          {savedMsg && (
            <span
              className={`text-sm ${savedMsg.includes("Lỗi") ? "text-red-500" : "text-emerald-600"}`}
            >
              {savedMsg}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">STT</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead className="w-[90px] text-center">Nửa ngày</TableHead>
              <TableHead className="w-[90px] text-center">Đủ ngày</TableHead>
              <TableHead className="w-[90px] text-center">Tăng ca</TableHead>
              <TableHead className="w-[80px] text-center">Vắng</TableHead>
              <TableHead className="w-[200px]">Ghi chú</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8">
                  <div className="flex justify-center">
                    <LoadingBars message="Đang tải..." />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-neutral-400">
                  Không có nhân viên nào
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((emp, idx) => {
                const entry = entries[emp.id];
                return (
                  <TableRow key={emp.id}>
                    <TableCell className="text-neutral-400">{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {emp.full_name || "—"}
                    </TableCell>
                    <TableCell className="text-neutral-500">
                      {(emp.departments as { name: string } | null)?.name ||
                        "—"}
                    </TableCell>
                    {valueOptions.map((opt) => (
                      <TableCell key={opt.value} className="text-center">
                        <input
                          type="radio"
                          name={`attendance-${emp.id}`}
                          checked={entry?.value === opt.value}
                          onChange={() => updateValue(emp.id, opt.value)}
                          className="h-4 w-4 cursor-pointer accent-neutral-900"
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Input
                        value={entry?.note || defaultNote}
                        onChange={(e) => updateNote(emp.id, e.target.value)}
                        placeholder={defaultNote}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
