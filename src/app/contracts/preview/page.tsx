"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ContractPreviewPage() {
  const searchParams = useSearchParams();
  const previewRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const employeeId = searchParams.get("employeeId");
    const contractType = searchParams.get("contractType");
    const extraFieldsParam = searchParams.get("extraFields");

    if (!employeeId || !contractType) {
      setError("Thiếu thông tin hợp đồng");
      setLoading(false);
      return;
    }

    let extraFields: Record<string, string> = {};
    try {
      if (extraFieldsParam) {
        extraFields = JSON.parse(extraFieldsParam);
      }
    } catch {
      setError("Dữ liệu không hợp lệ");
      setLoading(false);
      return;
    }

    fetch("/api/contracts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, contractType, extraFields }),
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Lỗi tạo hợp đồng");
        }
        return res.blob();
      })
      .then(async (blob) => {
        if (!previewRef.current) return;
        const { renderAsync } = await import("docx-preview");
        previewRef.current.innerHTML = "";
        await renderAsync(blob, previewRef.current, undefined, {
          className: "docx-preview",
          inWrapper: true,
        });
      })
      .catch((err) => {
        setError(err.message || "Lỗi kết nối server");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <span className="ml-3 text-neutral-500">Đang tải bản xem trước...</span>
        </div>
      )}
      <div ref={previewRef} className="mx-auto" />
    </div>
  );
}
