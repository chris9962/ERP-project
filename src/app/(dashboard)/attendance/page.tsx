"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
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
import { Save, Search, EyeOff, ScanLine } from "lucide-react";
import LoadingBars from "@/components/ui/loading-bars";
import { CCCDQRScanner } from "@/components/cccd-qr-scanner";
import { HeaderActions } from "@/components/layout/header-actions";
import { getRoleLabel } from "@/lib/utils";
import { AttendanceQRModal } from "@/components/attendance-qr-modal";

type Employee = {
  id: string;
  employee_code: string | null;
  full_name: string | null;
  cccd_number?: string | null;
  department_id: string | null;
  departments: { id: string; name: string } | null;
  profiles: { roles: { name: string } | null } | null;
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
  const [searchName, setSearchName] = useState("");
  const [hideMarked, setHideMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResultModalOpen, setScanResultModalOpen] = useState(false);
  const [scanResultEmployee, setScanResultEmployee] = useState<Employee | null>(null);
  const [scanResultValue, setScanResultValue] = useState<number | null>(null);
  const [scanResultExisting, setScanResultExisting] = useState<{ value: number; note: string } | null>(null);

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
      const val = v.value;
      const numVal = val == null ? null : Number(val);
      const value =
        numVal != null && Number.isFinite(numVal) ? numVal : (val as number | null);
      entriesWithNote[k] = {
        ...v,
        employeeId: v.employeeId || k,
        value: value as number | null,
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

  const filteredEmployees = employees
    .filter(
      (emp) =>
        filterDept === "all" ||
        (emp.departments as { id: string } | null)?.id === filterDept,
    )
    .filter((emp) => {
      const name = (emp.full_name || "").toLowerCase();
      const q = searchName.trim().toLowerCase();
      return !q || name.includes(q);
    })
    .filter((emp) => {
      if (!hideMarked) return true;
      const entry = entries[emp.id];
      return entry?.value == null;
    });

  const valueOptions = [
    { value: 0.5, label: "Nửa ngày" },
    { value: 1, label: "Đủ ngày" },
    { value: 1.5, label: "Tăng ca" },
    { value: 0, label: "Vắng" },
  ];

  function handleQrScanResult(data: { fullName: string; cccdNumber: string | null }) {
    setScannerOpen(false);
    if (!data.cccdNumber?.trim()) {
      setSavedMsg("Không đọc được số CCCD từ mã QR");
      return;
    }
    const found = employees.find(
      (e) => (e.cccd_number || "").trim() === data.cccdNumber!.trim(),
    );
    if (found) {
      const entry = entries[found.id];
      setScanResultEmployee(found);
      setScanResultValue(entry?.value ?? null);
      setScanResultExisting(entry?.value != null ? { value: entry.value, note: entry.note || "" } : null);
      setScanResultModalOpen(true);
    } else {
      setSavedMsg("Không tìm thấy nhân viên với CCCD: " + data.cccdNumber);
    }
  }

  async function confirmScanResult() {
    if (!scanResultEmployee || scanResultValue == null) return;
    const empId = scanResultEmployee.id;
    const merged: Record<string, AttendanceEntry> = {
      ...entries,
      [empId]: {
        ...entries[empId],
        employeeId: empId,
        value: scanResultValue,
        note: entries[empId]?.note?.trim() ? entries[empId].note! : defaultNote,
      },
    };
    const entriesList = Object.values(merged)
      .filter((entry) => entry.value != null)
      .map((entry) => ({
        employeeId: entry.employeeId,
        value: entry.value as number,
        note: (entry.note?.trim() || defaultNote) || null,
      }));
    setSaving(true);
    setSavedMsg("");
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, entries: entriesList }),
      credentials: "include",
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setSavedMsg("Lỗi khi lưu: " + (data.error ?? res.statusText));
      return;
    }
    setScanResultModalOpen(false);
    setScanResultEmployee(null);
    setScanResultValue(null);
    setSavedMsg("Đã điểm danh " + (scanResultEmployee.full_name || ""));
    fetchData();
  }

  // const totalAttended = Object.values(entries).filter((e) => e.value != null && e.value > 0).length;
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
    <div className="space-y-4 sm:space-y-6">
      <HeaderActions>
        <Button
          size="sm"
          onClick={handleSaveAll}
          disabled={saving || loading}
        >
          <Save size="sm" className="h-4 w-4" />
          <span className="hidden ml-2 md:block">{saving ? "Đang lưu..." : "Lưu tất cả"}</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setScannerOpen(true)}
        >
          <ScanLine size="sm" className="h-4 w-4" />
          <span className="hidden ml-2 md:block">Quét CCCD</span>
        </Button>
      </HeaderActions>

      <div className="flex flex-col gap-4 sm:hidden">
        <div className="flex items-end gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <label className="text-xs font-medium text-neutral-500">Ngày</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <label className="text-xs font-medium text-neutral-500">Phòng ban</label>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-full">
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
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Tên nhân viên..."
                className="h-10 pl-8"
              />
            </div>
          </div>
          <Button
            type="button"
            variant={hideMarked ? "default" : "outline"}
            size="sm"
            onClick={() => setHideMarked((v) => !v)}
            className="shrink-0 h-9 w-9 p-0"
            title={hideMarked ? "Đang ẩn đã điểm danh" : "Ẩn người đã điểm danh"}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
        {savedMsg && (
          <span className={`text-sm ${savedMsg.includes("Lỗi") ? "text-red-500" : "text-emerald-600"}`}>
            {savedMsg}
          </span>
        )}
      </div>
      <div className="hidden sm:flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1 sm:min-w-0">
          <label className="text-xs font-medium text-neutral-500">Ngày</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full sm:w-[180px]"
          />
        </div>
        <div className="space-y-1 sm:min-w-0">
          <label className="text-xs font-medium text-neutral-500">Phòng ban</label>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
        <div className="space-y-1 sm:min-w-0">
          <label className="text-xs font-medium text-neutral-500">Tìm theo tên</label>
          <div className="relative w-full sm:w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Tên nhân viên..."
              className="h-10 pl-8"
            />
          </div>
        </div>
        <Button
          type="button"
          variant={hideMarked ? "default" : "outline"}
          size="sm"
          onClick={() => setHideMarked((v) => !v)}
          className="w-full sm:w-auto shrink-0"
        >
          <EyeOff className="mr-2 h-4 w-4" />
          {hideMarked ? "Đang ẩn đã điểm danh" : "Ẩn người đã điểm danh"}
        </Button>
        <div className="flex flex-wrap items-center gap-2 sm:pb-0.5">
          {savedMsg && (
            <span className={`text-sm ${savedMsg.includes("Lỗi") ? "text-red-500" : "text-emerald-600"}`}>
              {savedMsg}
            </span>
          )}
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">STT</TableHead>
              <TableHead className="min-w-[120px]">Họ tên</TableHead>
              <TableHead className="min-w-[100px]">Vai trò</TableHead>
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
                      {getRoleLabel(emp.profiles?.roles?.name)}
                    </TableCell>
                    {valueOptions.map((opt) => (
                      <TableCell key={opt.value} className="text-center">
                        <input
                          type="radio"
                          name={`attendance-table-${emp.id}`}
                          checked={entry?.value != null && Number(entry.value) === opt.value}
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

      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingBars message="Đang tải..." />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <p className="py-8 text-center text-neutral-400">Không có nhân viên nào</p>
        ) : (
          filteredEmployees.map((emp, idx) => {
            const entry = entries[emp.id];
            return (
              <div
                key={emp.id}
                className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900">
                      {idx + 1}. {emp.full_name || "—"}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {getRoleLabel(emp.profiles?.roles?.name)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {valueOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="radio"
                        name={`attendance-card-${emp.id}`}
                        checked={entry?.value != null && Number(entry.value) === opt.value}
                        onChange={() => updateValue(emp.id, opt.value)}
                        className="h-4 w-4 accent-neutral-900"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <Input
                  value={entry?.note || defaultNote}
                  onChange={(e) => updateNote(emp.id, e.target.value)}
                  placeholder={defaultNote}
                  className="h-9 text-sm"
                />
              </div>
            );
          })
        )}
      </div>

      <CCCDQRScanner
        open={scannerOpen}
        onCloseAction={() => setScannerOpen(false)}
        onScanAction={handleQrScanResult}
      />

      <AttendanceQRModal
        open={scanResultModalOpen}
        onOpenChange={setScanResultModalOpen}
        employee={scanResultEmployee}
        existingAttendance={scanResultExisting}
        selectedValue={scanResultValue}
        onValueChange={setScanResultValue}
        onConfirm={confirmScanResult}
        saving={saving}
      />
    </div>
  );
}
