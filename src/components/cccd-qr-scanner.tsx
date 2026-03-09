"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2 } from "lucide-react";
import { parseCCCDFromQR, type CCCDQRData } from "@/lib/cccd-qr";
import { decodeQRFromImage, decodeQRFromVideo } from "@/lib/qr-decode";

type CCCDQRScannerProps = {
  open: boolean;
  onCloseAction: () => void;
  onScanAction: (data: CCCDQRData) => void;
};

export function CCCDQRScanner({ open, onCloseAction, onScanAction }: CCCDQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [cameraDenied, setCameraDenied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const foundRef = useRef(false);
  const mountedRef = useRef(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleResult = useCallback(
    (rawData: string) => {
      console.log("QR raw:", rawData);
      const parsed = parseCCCDFromQR(rawData);
      console.log("Parsed:", parsed);
      if (parsed) {
        foundRef.current = true;
        stopCamera();
        onScanAction(parsed);
        onCloseAction();
        return true;
      }
      return false;
    },
    [stopCamera, onScanAction, onCloseAction]
  );

  const startCamera = useCallback(async () => {
    if (!mountedRef.current || foundRef.current) return;

    setScanning(true);
    setProcessing(false);

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 620 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      }

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.() as Record<string, unknown> | undefined;
      if (caps?.focusMode) {
        try {
          await track.applyConstraints({ focusMode: "continuous" } as MediaTrackConstraints);
        } catch { /* ignore */ }
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();
      setScanning(false);

      let decoding = false;

      const scan = async () => {
        if (!mountedRef.current || foundRef.current) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA && !decoding) {
          decoding = true;
          try {
            const result = await decodeQRFromVideo(video);
            if (result && mountedRef.current && !foundRef.current) {
              if (handleResult(result)) return;
            }
          } catch {
            // ignore decode errors
          }
          decoding = false;
        }

        if (mountedRef.current && !foundRef.current) {
          rafRef.current = requestAnimationFrame(scan);
        }
      };

      rafRef.current = requestAnimationFrame(scan);
    } catch (e) {
      if (mountedRef.current) {
        const msg = e instanceof Error ? e.message : "Không thể mở camera";
        const isDenied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "PermissionDeniedError");
        if (isDenied) {
          setCameraDenied(true);
          setError(null);
        } else {
          setError(msg);
        }
        setScanning(false);
      }
    }
  }, [handleResult, stopCamera]);

  // Decode QR từ ảnh file (chụp từ camera native hoặc chọn ảnh)
  const handleFileCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Tắt camera, hiện overlay processing
      stopCamera();
      setProcessing(true);
      setDebugInfo("");

      try {
        const bitmap = await createImageBitmap(file);
        const result = await decodeQRFromImage(bitmap);

        if (result) {
          handleResult(result);
        } else {
          setDebugInfo("Không tìm thấy QR trong ảnh. Thử chụp rõ hơn, đảm bảo QR code không bị mờ hoặc che khuất.");
          // Mở lại camera
          startCamera();
        }
      } catch (err) {
        console.error("File decode error:", err);
        setDebugInfo("Lỗi đọc ảnh: " + (err instanceof Error ? err.message : "unknown"));
        // Mở lại camera
        startCamera();
      }

      e.target.value = "";
    },
    [handleResult, stopCamera, startCamera]
  );

  useEffect(() => {
    if (!open) return;

    mountedRef.current = true;
    foundRef.current = false;
    setError(null);
    setDebugInfo("");
    setCameraDenied(false);

    startCamera();

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [open, stopCamera, startCamera]);

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
          {!cameraDenied && (
            <div className="relative w-full rounded-lg bg-neutral-900 overflow-hidden max-h-96 " style={{ minHeight: 280 }}>
              <video
                ref={videoRef}
                className="w-full h-auto"
                playsInline
                muted
                style={{ display: processing ? "none" : "block" }}
              />
              {/* Khung scan overlay */}
              {!processing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white/60 rounded-lg" style={{ width: "80%", height: "80%" }} />
                </div>
              )}
              {/* Processing overlay */}
              {processing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-900">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <p className="text-sm text-white/80">Đang phân tích ảnh...</p>
                </div>
              )}
            </div>
          )}

          {cameraDenied && (
            <div className="flex flex-col items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 py-8 px-4 gap-2">
              {processing ? (
                <>
                  <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
                  <p className="text-sm text-neutral-500">Đang phân tích ảnh...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="w-10 h-10 text-neutral-400" />
                  <p className="text-sm text-neutral-500 text-center">
                    Không có quyền truy cập camera. Chọn ảnh có mã QR bên dưới.
                  </p>
                </>
              )}
            </div>
          )}

          {debugInfo && (
            <p className="text-xs text-neutral-400 font-mono break-all">{debugInfo}</p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {scanning && !error && !cameraDenied && (
            <p className="text-sm text-neutral-500">
              Đang mở camera... Đưa mã QR trên CCCD vào khung hình
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileCapture}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="default"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Chọn ảnh QR
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={onCloseAction}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
