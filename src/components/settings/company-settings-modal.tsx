"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CompanySettings {
  employer_name: string;
  employer_title: string;
  employer_address: string;
  employer_phone: string;
  employer_tax_code: string;
  contract_location: string;
}

const FIELDS = [
  { key: "employer_name", label: "Người đại diện (Ông/Bà)", placeholder: "Họ tên người đại diện" },
  { key: "employer_title", label: "Chức vụ", placeholder: "VD: Giám đốc" },
  { key: "employer_address", label: "Địa chỉ công ty", placeholder: "Địa chỉ đầy đủ" },
  { key: "employer_phone", label: "Điện thoại", placeholder: "Số điện thoại công ty" },
  { key: "employer_tax_code", label: "Mã số thuế", placeholder: "MST công ty" },
  { key: "contract_location", label: "Nơi lập hợp đồng", placeholder: "VD: Cần Thơ" },
] as const;

interface CompanySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: CompanySettings | null;
  onSaved: (data: CompanySettings) => void;
}

export default function CompanySettingsModal({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: CompanySettingsModalProps) {
  const [form, setForm] = useState<CompanySettings>({
    employer_name: "",
    employer_title: "",
    employer_address: "",
    employer_phone: "",
    employer_tax_code: "",
    contract_location: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        employer_name: initialData.employer_name || "",
        employer_title: initialData.employer_title || "",
        employer_address: initialData.employer_address || "",
        employer_phone: initialData.employer_phone || "",
        employer_tax_code: initialData.employer_tax_code || "",
        contract_location: initialData.contract_location || "",
      });
    }
  }, [initialData]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Lỗi khi lưu");
        return;
      }

      const data = await res.json();
      toast.success("Đã lưu thông tin công ty");
      onSaved(data);
      onOpenChange(false);
    } catch {
      toast.error("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thông tin công ty (Bên A)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-sm">{f.label}</Label>
              <Input
                value={form[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Đang lưu...</span>
              </>
            ) : (
              "Lưu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
