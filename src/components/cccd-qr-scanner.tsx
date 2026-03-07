"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseCCCDFromQR, type CCCDQRData } from "@/lib/cccd-qr";

type CCCDQRScannerProps = {
  open: boolean;
  onCloseAction: () => void;
  onScanAction: (data: CCCDQRData) => void;
};

export function CCCDQRScanner({ open, onCloseAction, onScanAction }: CCCDQRScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    setError(null);
    setScanning(true);
    const scannerId = "cccd-qr-" + Date.now();

    const init = async () => {
      // Đợi modal render xong và có kích thước thực (tránh container width/height = 0)
      await new Promise((r) => setTimeout(r, 350));
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const container = containerRef.current;
      if (!container || !mounted) return;
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      if (width < 100 || height < 100) {
        await new Promise((r) => setTimeout(r, 200));
      }

      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        container.innerHTML = "";
        const div = document.createElement("div");
        div.id = scannerId;
        div.className = "cccd-scanner-reader";
        div.style.width = "100%";
        div.style.minHeight = "280px";
        div.style.position = "relative";
        div.style.overflow = "visible";
        container.appendChild(div);

        if (!mounted) return;

        const html5Qr = new Html5Qrcode(scannerId);
        await html5Qr.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (!mounted) return;
            const data = parseCCCDFromQR(decodedText);
            if (data) {
              html5Qr.stop().catch(() => {});
              scannerRef.current = null;
              onScanAction(data);
              onCloseAction();
            }
          },
          () => {},
        );

        if (mounted) {
          scannerRef.current = html5Qr;
          setScanning(false);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Không thể mở camera");
          setScanning(false);
        }
      }
    };

    init();
    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, onScanAction, onCloseAction]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCloseAction()}>
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Quét QR CCCD</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div
            ref={containerRef}
            className="w-full rounded-lg bg-neutral-900"
            style={{ minHeight: 280 }}
          />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {scanning && !error && (
            <p className="text-sm text-neutral-500">
              Đang mở camera... Đưa mã QR trên CCCD vào khung hình
            </p>
          )}
          <Button type="button" variant="outline" className="w-full" onClick={onCloseAction}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
