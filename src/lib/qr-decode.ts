/**
 * Multi-strategy QR decoder for CCCD images.
 * Priority: qr-scanner (ZXing WASM) → BarcodeDetector API → jsqr with preprocessing.
 *
 * qr-scanner uses ZXing compiled to WASM - much more robust than jsqr for
 * blurry, small, or low-contrast QR codes like those on Vietnamese CCCD cards.
 */
import QrScanner from "qr-scanner";

// ── Image preprocessing helpers (for jsqr fallback) ──

function toGrayscale(data: ImageData): ImageData {
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    d[i] = d[i + 1] = d[i + 2] = gray;
  }
  return data;
}

function adjustContrast(data: ImageData, factor: number): ImageData {
  const d = data.data;
  const intercept = 128 * (1 - factor);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, Math.max(0, d[i] * factor + intercept));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] * factor + intercept));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] * factor + intercept));
  }
  return data;
}

function binarize(data: ImageData): ImageData {
  const d = data.data;
  const hist = new Array(256).fill(0);
  for (let i = 0; i < d.length; i += 4) hist[d[i]]++;
  const total = d.length / 4;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, wF = 0, maxVar = 0, threshold = 128;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;
    sumB += i * hist[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxVar) { maxVar = between; threshold = i; }
  }
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i] >= threshold ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  return data;
}

// ── Canvas helpers ──

function createCropCanvas(
  source: ImageBitmap | HTMLCanvasElement | HTMLVideoElement,
  sx: number, sy: number, sw: number, sh: number,
  dw?: number, dh?: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = dw ?? sw;
  canvas.height = dh ?? sh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function sourceToCanvas(source: ImageBitmap | HTMLVideoElement): HTMLCanvasElement {
  const w = "videoWidth" in source ? source.videoWidth : source.width;
  const h = "videoHeight" in source ? source.videoHeight : source.height;
  return createCropCanvas(source, 0, 0, w, h);
}

type Region = { x: number; y: number; w: number; h: number };

function getCropRegions(imgW: number, imgH: number): Region[] {
  return [
    // Full image
    { x: 0, y: 0, w: imgW, h: imgH },
    // Top-right quadrant
    { x: Math.round(imgW * 0.55), y: 0, w: Math.round(imgW * 0.45), h: Math.round(imgH * 0.5) },
    // Bottom-right quadrant (QR có thể nằm ở dưới)
    { x: Math.round(imgW * 0.55), y: Math.round(imgH * 0.5), w: Math.round(imgW * 0.45), h: Math.round(imgH * 0.5) },
    // Right half
    { x: Math.round(imgW * 0.5), y: 0, w: Math.round(imgW * 0.5), h: imgH },
    // Bottom half
    { x: 0, y: Math.round(imgH * 0.5), w: imgW, h: Math.round(imgH * 0.5) },
    // Top half
    { x: 0, y: 0, w: imgW, h: Math.round(imgH * 0.5) },
  ];
}

// ── Timeout helper ──

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

// ── Strategy 1: qr-scanner (ZXing WASM) - most robust ──

async function tryQrScanner(canvas: HTMLCanvasElement): Promise<string | null> {
  try {
    const result = await withTimeout(
      QrScanner.scanImage(canvas, {
        returnDetailedScanResult: true,
        alsoTryWithoutScanRegion: true,
      }),
      5000
    );
    if (result?.data) return result.data;
  } catch {
    // QR not found or error
  }
  return null;
}

// ── Strategy 2: Native BarcodeDetector API ──

async function tryBarcodeDetector(source: HTMLCanvasElement): Promise<string | null> {
  if (!("BarcodeDetector" in globalThis)) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detector = new (globalThis as any).BarcodeDetector({ formats: ["qr_code"] });
    const results = await detector.detect(source);
    if (results.length > 0 && results[0].rawValue) {
      return results[0].rawValue as string;
    }
  } catch {
    // Not supported or failed
  }
  return null;
}

// ── Strategy 3: jsQR with preprocessing ──

async function tryJsQR(canvas: HTMLCanvasElement): Promise<string | null> {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const jsQR = (await import("jsqr")).default;

  // Raw
  const raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const c1 = jsQR(raw.data, raw.width, raw.height, { inversionAttempts: "attemptBoth" });
  if (c1?.data) return c1.data;

  // Grayscale + high contrast
  const gray = ctx.getImageData(0, 0, canvas.width, canvas.height);
  toGrayscale(gray);
  adjustContrast(gray, 2.0);
  const c2 = jsQR(gray.data, gray.width, gray.height, { inversionAttempts: "attemptBoth" });
  if (c2?.data) return c2.data;

  // Binarized
  const bin = ctx.getImageData(0, 0, canvas.width, canvas.height);
  toGrayscale(bin);
  binarize(bin);
  const c3 = jsQR(bin.data, bin.width, bin.height, { inversionAttempts: "attemptBoth" });
  if (c3?.data) return c3.data;

  return null;
}

// ── Mobile detection ──

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// ── Simple decoder (mobile - version cũ, nhẹ, ổn định) ──

async function decodeQRSimple(source: ImageBitmap): Promise<string | null> {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const jsQR = (await import("jsqr")).default;
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
  return code?.data ?? null;
}

// ── Main decoder: chọn strategy theo thiết bị ──

export async function decodeQRFromImage(source: ImageBitmap): Promise<string | null> {
  if (isMobile()) {
    return decodeQRSimple(source);
  }
  // Desktop: multi-strategy, timeout 15s
  return withTimeout(decodeQRFromImageInner(source), 15000);
}

async function decodeQRFromImageInner(source: ImageBitmap): Promise<string | null> {
  const sw = source.width;
  const sh = source.height;
  const regions = getCropRegions(sw, sh);

  // Strategy 1: qr-scanner (ZXing) on cropped regions + upscaled
  for (const r of regions) {
    const canvas = createCropCanvas(source, r.x, r.y, r.w, r.h);
    const result = await tryQrScanner(canvas);
    if (result) return result;

    // Try 2x upscale for small QR
    if (r.w < 800) {
      const upscaled = createCropCanvas(source, r.x, r.y, r.w, r.h, r.w * 2, r.h * 2);
      const result2 = await tryQrScanner(upscaled);
      if (result2) return result2;
    }
  }

  // Strategy 2: BarcodeDetector on regions
  for (const r of regions) {
    const canvas = createCropCanvas(source, r.x, r.y, r.w, r.h);
    const result = await tryBarcodeDetector(canvas);
    if (result) return result;
  }

  // Strategy 3: jsQR with preprocessing on regions + scales
  const scales = [1, 2, 0.5];
  for (const r of regions) {
    for (const scale of scales) {
      const w = Math.round(r.w * scale);
      const h = Math.round(r.h * scale);
      if (w < 50 || h < 50 || w > 4000 || h > 4000) continue;
      const canvas = createCropCanvas(source, r.x, r.y, r.w, r.h, w, h);
      const result = await tryJsQR(canvas);
      if (result) return result;
    }
  }

  return null;
}

// ── Video frame decoder ──

export async function decodeQRFromVideo(video: HTMLVideoElement): Promise<string | null> {
  const canvas = sourceToCanvas(video);

  if (isMobile()) {
    // Mobile: jsqr đơn giản, nhẹ, nhanh
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const jsQR = (await import("jsqr")).default;
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
    return code?.data ?? null;
  }

  // Desktop: multi-strategy
  const qrResult = await tryQrScanner(canvas);
  if (qrResult) return qrResult;

  const bdResult = await tryBarcodeDetector(canvas);
  if (bdResult) return bdResult;

  const cropX = Math.round(canvas.width * 0.55);
  const cropW = canvas.width - cropX;
  const cropH = Math.round(canvas.height * 0.5);
  const cropCanvas = createCropCanvas(canvas, cropX, 0, cropW, cropH);
  const cropResult = await tryQrScanner(cropCanvas);
  if (cropResult) return cropResult;

  return null;
}
