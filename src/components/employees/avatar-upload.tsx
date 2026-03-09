"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";

type Props = {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved?: () => void;
};

export default function AvatarUpload({ currentUrl, onUploaded, onRemoved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `avatars/${fileName}`;

      const { error } = await supabase.storage
        .from("employee-avatars")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("employee-avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleRemove() {
    setPreview(null);
    onRemoved?.();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-28 w-28">
        <div className="h-full w-full rounded-full bg-neutral-100 overflow-hidden border-2 border-neutral-200">
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-400">
              <Camera className="h-8 w-8" />
            </div>
          )}
        </div>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-0 right-0 rounded-full bg-neutral-800 p-1 text-white shadow-sm hover:bg-neutral-900"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {uploading && (
        <p className="text-xs text-neutral-500">Đang tải lên...</p>
      )}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-1 h-3.5 w-3.5" />
          Chọn ảnh
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="mr-1 h-3.5 w-3.5" />
          Chụp
        </Button>
      </div>
    </div>
  );
}
