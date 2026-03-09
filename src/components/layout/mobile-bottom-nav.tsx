"use client";

import { useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, CalendarCheck, Users, User, ScanLine } from "lucide-react";
import LoadingBars from "@/components/ui/loading-bars";
import { CCCDQRScanner } from "@/components/cccd-qr-scanner";
import type { CCCDQRData } from "@/lib/cccd-qr";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getRouteRoles } from "@/lib/navigation";
import { AttendanceQRModal } from "@/components/attendance-qr-modal";

type FoundEmployee = {
  id: string;
  full_name: string | null;
  employee_code: string | null;
  departments: { name: string } | null;
};

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Trang chủ" },
  { href: "/attendance", icon: CalendarCheck, label: "Điểm danh" },
  { href: "__qr__", icon: ScanLine, label: "Quét QR" },
  { href: "/employees", icon: Users, label: "Nhân viên" },
  { href: "/profile", icon: User, label: "Cá nhân" },
];

const VALUE_OPTIONS = [
  { value: 0.5, label: "Nửa ngày" },
  { value: 1, label: "Đủ ngày" },
  { value: 1.5, label: "Tăng ca" },
  { value: 0, label: "Vắng" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, roleName: userRole } = useAuth();

  const ALLOWED_ROLES = ["admin", "owner", "manager"];
  const showNav = userRole && ALLOWED_ROLES.includes(userRole);

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.href === "__qr__" || item.href === "/profile") return true;
    const allowedRoles = getRouteRoles(item.href);
    if (!allowedRoles || !userRole) return true;
    return allowedRoles.includes(userRole);
  });

  const [scannerOpen, setScannerOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [notFoundModalOpen, setNotFoundModalOpen] = useState(false);
  const [foundEmployee, setFoundEmployee] = useState<FoundEmployee | null>(null);
  const [attendanceValue, setAttendanceValue] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [scannedData, setScannedData] = useState<CCCDQRData | null>(null);
  const [existingAttendance, setExistingAttendance] = useState<{ value: number; note: string } | null>(null);

  const handleQrScan = useCallback(
    async (data: CCCDQRData) => {
      setScannerOpen(false);
      setScannedData(data);

      if (!data.cccdNumber?.trim()) {
        toast.error("Không đọc được số CCCD từ mã QR");
        return;
      }

      setSearching(true);

      try {
        const res = await fetch(
          `/api/employees/search-cccd?cccd=${encodeURIComponent(data.cccdNumber.trim())}`,
          { credentials: "include" },
        );
        if (!res.ok) {
          toast.error("Lỗi khi tìm nhân viên");
          setSearching(false);
          return;
        }
        const { employee, todayAttendance } = await res.json();

        setSearching(false);

        if (employee) {
          setFoundEmployee(employee);
          setExistingAttendance(todayAttendance);
          setAttendanceValue(todayAttendance?.value != null ? Number(todayAttendance.value) : null);
          setAttendanceModalOpen(true);
        } else {
          setNotFoundModalOpen(true);
        }
      } catch {
        setSearching(false);
        toast.error("Lỗi kết nối server");
      }
    },
    [],
  );

  const handleConfirmAttendance = useCallback(async () => {
    if (!foundEmployee || attendanceValue == null) return;
    setSaving(true);

    const today = new Date().toISOString().split("T")[0];
    const defaultNote = `Điểm danh bởi ${profile?.full_name || "User"}`;

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          entries: [
            {
              employeeId: foundEmployee.id,
              value: attendanceValue,
              note: defaultNote,
            },
          ],
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error("Lỗi: " + (data.error ?? res.statusText));
      } else {
        toast.success(`Đã điểm danh ${foundEmployee.full_name || ""}`);
        setAttendanceModalOpen(false);
        setFoundEmployee(null);
        setAttendanceValue(null);
      }
    } catch {
      toast.error("Lỗi kết nối server");
    }

    setSaving(false);
  }, [foundEmployee, attendanceValue, profile?.full_name]);

  const handleGoToAddEmployee = useCallback(() => {
    setNotFoundModalOpen(false);
    const params = new URLSearchParams();
    if (scannedData?.fullName) params.set("fullName", scannedData.fullName);
    if (scannedData?.cccdNumber) params.set("cccd", scannedData.cccdNumber);
    if (scannedData?.dob) params.set("dob", scannedData.dob);
    if (scannedData?.address) params.set("address", scannedData.address);
    if (scannedData?.gender) params.set("gender", scannedData.gender);
    router.push(`/employees/new?${params.toString()}`);
  }, [router, scannedData]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  if (!showNav) return null;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white md:hidden">
        <div className="flex items-end justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {visibleNavItems.map((item) => {
            if (item.href === "__qr__") {
              return (
                <button
                  key="qr"
                  onClick={() => setScannerOpen(true)}
                  className="flex flex-col items-center -mt-4"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg">
                    <ScanLine className="h-6 w-6" />
                  </div>
                  <span className="mt-0.5 text-[10px] font-medium text-neutral-900">
                    {item.label}
                  </span>
                </button>
              );
            }

            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex flex-col items-center py-2 px-1 min-w-[56px]",
                  active ? "text-neutral-900" : "text-neutral-400",
                )}
              >
                <Icon className="h-5 w-5" />
                <span
                  className={cn(
                    "mt-0.5 text-[10px]",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <CCCDQRScanner
        open={scannerOpen}
        onCloseAction={() => setScannerOpen(false)}
        onScanAction={handleQrScan}
      />

      {/* Searching overlay */}
      {searching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <LoadingBars message="Đang tìm nhân viên..." />
        </div>
      )}

      <AttendanceQRModal
        open={attendanceModalOpen}
        onOpenChange={setAttendanceModalOpen}
        employee={foundEmployee}
        existingAttendance={existingAttendance}
        selectedValue={attendanceValue}
        onValueChange={setAttendanceValue}
        onConfirm={handleConfirmAttendance}
        saving={saving}
      />

      {/* Not found modal */}
      <Dialog open={notFoundModalOpen} onOpenChange={setNotFoundModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Không tìm thấy nhân viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Không tìm thấy nhân viên với CCCD{" "}
              <span className="font-medium">{scannedData?.cccdNumber}</span>
              {scannedData?.fullName && (
                <>
                  {" "}({scannedData.fullName})
                </>
              )}
              . Bạn có muốn thêm nhân viên mới không?
            </p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleGoToAddEmployee}>
                Thêm nhân viên
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setNotFoundModalOpen(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
