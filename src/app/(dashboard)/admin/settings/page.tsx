"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Building2 } from "lucide-react";
import LoadingBars from "@/components/ui/loading-bars";
import CompanySettingsModal from "@/components/settings/company-settings-modal";

interface CompanySettings {
  employer_name: string;
  employer_title: string;
  employer_address: string;
  employer_phone: string;
  employer_tax_code: string;
  contract_location: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/company", { credentials: "include" });
      if (res.ok) {
        setSettings(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingBars message="Đang tải..." />
      </div>
    );
  }

  const fields = [
    { label: "Người đại diện", value: settings?.employer_name },
    { label: "Chức vụ", value: settings?.employer_title },
    { label: "Địa chỉ", value: settings?.employer_address },
    { label: "Điện thoại", value: settings?.employer_phone },
    { label: "Mã số thuế", value: settings?.employer_tax_code },
    { label: "Nơi lập hợp đồng", value: settings?.contract_location },
  ];

  const hasData = fields.some((f) => f.value);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-neutral-500" />
            <h2 className="text-base font-semibold">Thông tin công ty (Bên A)</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Chỉnh sửa
          </Button>
        </div>
        <div className="p-4">
          {!hasData ? (
            <p className="text-sm text-neutral-400">
              Chưa có thông tin. Nhấn &quot;Chỉnh sửa&quot; để nhập thông tin công ty.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.label}>
                  <p className="text-xs text-neutral-500">{f.label}</p>
                  <p className="text-sm font-medium">{f.value || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CompanySettingsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={settings}
        onSaved={setSettings}
      />
    </div>
  );
}
