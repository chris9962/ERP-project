"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { parseCCCDFromQR, type CCCDQRData } from "@/lib/cccd-qr";

type CCCDQRScannerProps = {
  open: boolean;
  onCloseAction: () => void;
  onScanAction: (data: CCCDQRData) => void;
};

export function CCCDQRScanner({ open, onCloseAction, onScanAction }: CCCDQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const foundRef = useRef(false);

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

  // Decode QR từ ảnh file (chụp từ camera native hoặc chọn ảnh)
  const handleFileCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const jsQR = (await import("jsqr")).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code?.data) {
          handleResult(code.data);
        } else {
          setDebugInfo("Không tìm thấy QR trong ảnh. Thử chụp rõ hơn.");
        }
      } catch (err) {
        console.error("File decode error:", err);
        setDebugInfo("Lỗi đọc ảnh: " + (err instanceof Error ? err.message : "unknown"));
      }

      e.target.value = "";
    },
    [handleResult]
  );

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    foundRef.current = false;
    setError(null);
    setScanning(true);
    setDebugInfo("");

    const init = async () => {
      try {
        const jsQRFn = (await import("jsqr")).default;

        // Yêu cầu camera HD + autofocus liên tục
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
          // Fallback nếu exact: environment fail
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
          });
        }

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Bật autofocus liên tục nếu có
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities?.() as Record<string, unknown> | undefined;
        if (caps?.focusMode) {
          try {
            await track.applyConstraints({
              focusMode: "continuous",
            } as MediaTrackConstraints);
          } catch { /* ignore */ }
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        setScanning(false);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        let frameCount = 0;

        const scan = () => {
          if (!mounted || foundRef.current) return;

          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            frameCount++;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQRFn(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth",
            });

            if (code?.data && mounted && !foundRef.current) {
              if (handleResult(code.data)) return;
            }

            if (frameCount % 60 === 0 && mounted) {
              setDebugInfo(
                `Đang quét... (${frameCount} frames, ${canvas.width}x${canvas.height})`
              );
            }
          }

          rafRef.current = requestAnimationFrame(scan);
        };

        rafRef.current = requestAnimationFrame(scan);
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
      stopCamera();
    };
  }, [open, onScanAction, onCloseAction, stopCamera, handleResult]);

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
          <div className="relative w-full rounded-lg bg-neutral-900 overflow-hidden max-h-96 " style={{ minHeight: 280 }}>
            <video
              ref={videoRef}
              className="w-full h-auto"
              playsInline
              muted
              style={{ display: "block" }}
            />
            <canvas ref={canvasRef} className="hidden" />
            {/* Khung scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white/60 rounded-lg" style={{ width: "80%", height: "80%" }} />
            </div>
          </div>

          {/* {debugInfo && (
            <p className="text-xs text-neutral-400 font-mono break-all">{debugInfo}</p>
          )} */}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {scanning && !error && (
            <p className="text-sm text-neutral-500">
              Đang mở camera... Đưa mã QR trên CCCD vào khung hình
            </p>
          )}

          {/* Nút chụp ảnh - dùng native camera app để chụp ảnh rõ nét hơn */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
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
              <Camera className="w-4 h-4 mr-2" />
              Chụp ảnh QR
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
