"use client";

import { useEffect, useState, useCallback } from "react";
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
  value: number;
  note: string;
  existing: boolean;
};

type Department = { id: string; name: string };

export default function AttendancePage() {
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
    setEntries(data.entries || {});
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateValue(empId: string, value: number) {
    setEntries((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], value },
    }));
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
    const entriesList = Object.values(entries).map((entry) => ({
      employeeId: entry.employeeId,
      value: entry.value,
      note: entry.note || null,
    }));
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, entries: entriesList }),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json();
      setSavedMsg("Loi khi luu: " + (data.error ?? res.statusText));
    } else {
      setSavedMsg("Da luu diem danh thanh cong!");
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
    { value: 0.5, label: "0.5" },
    { value: 1, label: "1" },
    { value: 1.5, label: "1.5" },
    { value: 0, label: "Vang" },
  ];

  const totalAttended = Object.values(entries).filter(
    (e) => e.value > 0,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Diem danh</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Diem danh nhan vien theo ngay
          </p>
        </div>
        <Button onClick={handleSaveAll} disabled={saving || loading}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Dang luu..." : "Luu tat ca"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">Ngay</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">
            Phong ban
          </label>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tat ca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tat ca phong ban</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-3 pb-0.5">
          <Badge variant="outline" className="flex items-center gap-1.5 py-1.5">
            <CalendarCheck className="h-3.5 w-3.5" />
            {totalAttended}/{filteredEmployees.length} di lam
          </Badge>
          {savedMsg && (
            <span
              className={`text-sm ${savedMsg.includes("Loi") ? "text-red-500" : "text-emerald-600"}`}
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
              <TableHead>Ma NV</TableHead>
              <TableHead>Ho ten</TableHead>
              <TableHead>Phong ban</TableHead>
              <TableHead className="w-[80px] text-center">0.5</TableHead>
              <TableHead className="w-[80px] text-center">1</TableHead>
              <TableHead className="w-[80px] text-center">1.5</TableHead>
              <TableHead className="w-[80px] text-center">Vang</TableHead>
              <TableHead className="w-[200px]">Ghi chu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-neutral-400">
                  Dang tai...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-neutral-400">
                  Khong co nhan vien nao
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((emp, idx) => {
                const entry = entries[emp.id];
                return (
                  <TableRow key={emp.id}>
                    <TableCell className="text-neutral-400">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {emp.employee_code || "—"}
                    </TableCell>
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
                        value={entry?.note || ""}
                        onChange={(e) => updateNote(emp.id, e.target.value)}
                        placeholder="Ghi chu..."
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
