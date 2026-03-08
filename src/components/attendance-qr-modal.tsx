"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type AttendanceQRModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    full_name: string | null;
    employee_code?: string | null;
    departments?: { name: string } | null;
  } | null;
  existingAttendance?: { value: number; note: string } | null;
  selectedValue: number | null;
  onValueChange: (value: number) => void;
  onConfirm: () => void;
  saving: boolean;
};

const VALUE_OPTIONS = [
  { value: 0.5, label: "Nửa ngày" },
  { value: 1, label: "Đủ ngày" },
  { value: 1.5, label: "Tăng ca" },
  { value: 0, label: "Vắng" },
];

export function AttendanceQRModal({
  open,
  onOpenChange,
  employee,
  existingAttendance,
  selectedValue,
  onValueChange,
  onConfirm,
  saving,
}: AttendanceQRModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Điểm danh hôm nay</DialogTitle>
        </DialogHeader>
        {employee && (
          <div className="space-y-4">
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="font-medium text-neutral-900">
                {employee.full_name || "—"}
              </p>
              <p className="text-sm text-neutral-500">
                {employee.employee_code && employee.employee_code}
                {employee.departments?.name &&
                  `${employee.employee_code ? " · " : ""}${employee.departments.name}`}
              </p>
            </div>
            {existingAttendance && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-medium text-emerald-700">
                  Đã điểm danh:{" "}
                  {VALUE_OPTIONS.find(
                    (o) => o.value === Number(existingAttendance.value),
                  )?.label || existingAttendance.value}
                </p>
                {existingAttendance.note && (
                  <p className="mt-0.5 text-xs text-emerald-600">
                    {existingAttendance.note}
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-neutral-500">
              {existingAttendance
                ? "Chọn lại để cập nhật:"
                : "Chọn loại điểm danh:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {VALUE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-100"
                >
                  <input
                    type="radio"
                    name="attendance-qr-modal-value"
                    checked={selectedValue === opt.value}
                    onChange={() => onValueChange(opt.value)}
                    className="h-4 w-4 accent-neutral-900"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <Button
              className="w-full"
              disabled={selectedValue == null || saving}
              onClick={onConfirm}
            >
              {saving
                ? "Đang lưu..."
                : existingAttendance
                  ? "Cập nhật điểm danh"
                  : "Xác nhận điểm danh"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
