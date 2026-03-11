"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ContractType = "labor" | "task";

interface GenerateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    full_name: string | null;
    cccd_number: string | null;
    address: string | null;
    department: string | null;
    salary_amount: number | null;
    dob: string | null;
    employment_type: string;
    role_label?: string | null;
    contract_extra_data?: Record<string, string> | null;
  };
}

// Company (Ben A) fields - auto-filled from company_settings
const COMPANY_FIELDS = [
  { key: "employer_name", label: "Đại diện Bên A (Ông/Bà)", placeholder: "Họ tên người đại diện" },
  { key: "employer_title", label: "Chức vụ Bên A", placeholder: "VD: Giám đốc" },
  { key: "employer_address", label: "Địa chỉ Bên A", placeholder: "Địa chỉ công ty" },
  { key: "employer_phone", label: "Điện thoại Bên A", placeholder: "Số điện thoại" },
  { key: "employer_tax_code", label: "Mã số thuế", placeholder: "MST công ty" },
  { key: "contract_location", label: "Nơi lập hợp đồng", placeholder: "VD: Cần Thơ" },
];

// Employee-specific extra fields per contract type
const LABOR_EMPLOYEE_FIELDS = [
  { key: "contract_number", label: "Số hợp đồng", placeholder: "VD: 001" },
  { key: "nationality", label: "Quốc tịch", placeholder: "Việt Nam" },
  { key: "job_title", label: "Nghề nghiệp", placeholder: "VD: Công nhân" },
  { key: "position", label: "Chức danh chuyên môn", placeholder: "VD: Công nhân - Sản xuất" },
  { key: "responsibility_allowance", label: "Phụ cấp trách nhiệm (VNĐ)", placeholder: "0" },
];

const TASK_EMPLOYEE_FIELDS = [
  { key: "contract_number", label: "Số hợp đồng", placeholder: "VD: 001" },
  { key: "cccd_issue_place", label: "Nơi cấp CCCD", placeholder: "VD: CA TP Cần Thơ" },
  { key: "cccd_issue_date", label: "Ngày cấp CCCD", type: "date" as const },
  { key: "job_description", label: "Nội dung công việc", placeholder: "Mô tả công việc khoán" },
  { key: "work_location", label: "Nơi làm việc", placeholder: "Địa điểm làm việc" },
  { key: "duration_days", label: "Số ngày thực hiện", placeholder: "VD: 30" },
  { key: "start_date", label: "Ngày bắt đầu", type: "date" as const },
  { key: "end_date", label: "Ngày kết thúc", type: "date" as const },
];

// Convert dd/mm/yyyy -> yyyy-mm-dd for date input
function toISODate(ddmmyyyy: string): string {
  const m = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : ddmmyyyy;
}

// Convert yyyy-mm-dd -> dd/mm/yyyy for display/template
function toVNDate(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : isoDate;
}

export default function GenerateContractDialog({
  open,
  onOpenChange,
  employee,
}: GenerateContractDialogProps) {
  const [contractType, setContractType] = useState<ContractType>("labor");
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const employeeFields = contractType === "labor" ? LABOR_EMPLOYEE_FIELDS : TASK_EMPLOYEE_FIELDS;

  // Load company_settings + employee.contract_extra_data when dialog opens
  const loadAutoFillData = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/settings/company", { credentials: "include" });
      const companyData = res.ok ? await res.json() : {};

      // Merge: company settings (Ben A) + employee extra data (Ben B)
      const employeeExtra = employee.contract_extra_data || {};
      const merged: Record<string, string> = {};

      // Fill company fields
      for (const f of COMPANY_FIELDS) {
        if (companyData[f.key]) merged[f.key] = companyData[f.key];
      }

      // Fill employee extra fields
      for (const [key, value] of Object.entries(employeeExtra)) {
        if (value) merged[key] = value;
      }

      // Auto-fill defaults if not already saved
      if (!merged.nationality) merged.nationality = "Việt Nam";
      if (!merged.cccd_issue_place) merged.cccd_issue_place = "Cục Trưởng cục cảnh sát QLHCVTTXH";
      if (!merged.job_title && employee.role_label) {
        merged.job_title = employee.role_label;
      }
      if (!merged.position && employee.department) {
        merged.position = employee.department;
      }

      setExtraFields(merged);
    } catch {
      // Silently fail - user can still fill manually
    } finally {
      setLoadingData(false);
    }
  }, [employee.contract_extra_data, employee.role_label, employee.department]);

  useEffect(() => {
    if (open) {
      loadAutoFillData();
    }
  }, [open, loadAutoFillData]);

  function handleFieldChange(key: string, value: string) {
    setExtraFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleContractTypeChange(v: string) {
    setContractType(v as ContractType);
    // Keep existing fields (don't reset) so company data persists
  }

  function handlePreview() {
    const params = new URLSearchParams({
      employeeId: employee.id,
      contractType,
      extraFields: JSON.stringify(extraFields),
    });
    window.open(`/contracts/preview?${params.toString()}`, "_blank");
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.id,
          contractType,
          extraFields,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Lỗi tạo hợp đồng");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const disposition = res.headers.get("Content-Disposition");
      let filename = `hop-dong-${contractType}.docx`;
      if (disposition) {
        const match = disposition.match(/filename\*=UTF-8''(.+)/);
        if (match) filename = decodeURIComponent(match[1]);
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Đã tải hợp đồng thành công!");
      onOpenChange(false);
    } catch {
      toast.error("Lỗi kết nối server");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xuất hợp đồng</DialogTitle>
          <DialogDescription>
            Tạo hợp đồng cho {employee.full_name || "nhân viên"}. Thông tin Bên A
            và Bên B được tự động điền từ cài đặt.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Loại hợp đồng</Label>
              <Select value={contractType} onValueChange={handleContractTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">
                    Hợp đồng lao động không thời hạn
                  </SelectItem>
                  <SelectItem value="task">Hợp đồng khoán việc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto-filled employee info */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-1">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Thông tin nhân viên (tự động)
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-neutral-500">Họ tên:</span>
                <span>{employee.full_name || "—"}</span>
                <span className="text-neutral-500">CCCD:</span>
                <span>{employee.cccd_number || "—"}</span>
                <span className="text-neutral-500">Địa chỉ:</span>
                <span>{employee.address || "—"}</span>
                <span className="text-neutral-500">Phòng ban:</span>
                <span>{employee.department || "—"}</span>
                <span className="text-neutral-500">Lương:</span>
                <span>
                  {employee.salary_amount
                    ? new Intl.NumberFormat("vi-VN").format(employee.salary_amount) + " VNĐ"
                    : "—"}
                </span>
              </div>
            </div>

            {/* Company (Ben A) fields */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Thông tin Bên A (công ty)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {COMPANY_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    <Input
                      value={extraFields[f.key] || ""}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Employee extra (Ben B) fields */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Thông tin bổ sung Bên B</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {employeeFields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    {"type" in f && f.type === "date" ? (
                      <Input
                        type="date"
                        value={toISODate(extraFields[f.key] || "")}
                        onChange={(e) => handleFieldChange(f.key, e.target.value ? toVNDate(e.target.value) : "")}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <Input
                        value={extraFields[f.key] || ""}
                        onChange={(e) => handleFieldChange(f.key, e.target.value)}
                        placeholder={"placeholder" in f ? f.placeholder : ""}
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="outline" onClick={handlePreview} disabled={loadingData}>
            <Eye className="h-4 w-4" />
            <span className="ml-2">Xem trước</span>
          </Button>
          <Button onClick={handleGenerate} disabled={generating || loadingData}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Đang tạo...</span>
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                <span className="ml-2">Tải hợp đồng</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
