"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import {
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ImageIcon,
} from "lucide-react";

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

interface MediaUploaderProps {
  onClose: () => void;
  onComplete: () => void;
}

async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function MediaUploader({ onClose, onComplete }: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter((file) =>
      file.type.startsWith("image/")
    );

    const uploadFiles: UploadFile[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<boolean> => {
    try {
      // Update status
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "uploading" as const, progress: 10 } : f
        )
      );

      // Get image dimensions
      const { width, height } = await getImageDimensions(uploadFile.file);

      // Get presigned URL and create media record
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploadFile.file.name,
          contentType: uploadFile.file.type,
          size: uploadFile.file.size,
          width,
          height,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { presignedUrl } = await res.json();

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, progress: 30 } : f
        )
      );

      // Upload to R2
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: uploadFile.file,
        headers: {
          "Content-Type": uploadFile.file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "done" as const, progress: 100 }
            : f
        )
      );

      return true;
    } catch (error) {
      console.error("Upload error:", error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
      return false;
    }
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);

    // Check if all successful
    const allDone = files.every(
      (f) => f.status === "done" || f.status === "error"
    );
    if (allDone) {
      // Clean up previews
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      onComplete();
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium text-stone-900">上傳媒體</h2>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-stone-500 bg-stone-50"
                : "border-stone-200 hover:border-stone-300"
            }`}
          >
            <ImageIcon className="w-12 h-12 mx-auto text-stone-300 mb-3" />
            <p className="text-stone-600 mb-1">
              拖放圖片到此處，或點擊選擇檔案
            </p>
            <p className="text-sm text-stone-400">
              支援 JPG, PNG, WebP, GIF 格式
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-stone-100"
                >
                  <Image
                    src={file.preview}
                    alt={file.file.name}
                    fill
                    className="object-cover"
                  />

                  {/* Status Overlay */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center ${
                      file.status === "pending"
                        ? "bg-transparent"
                        : file.status === "uploading"
                        ? "bg-black/30"
                        : file.status === "done"
                        ? "bg-green-500/20"
                        : "bg-red-500/20"
                    }`}
                  >
                    {file.status === "uploading" && (
                      <div className="text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white mx-auto" />
                        <span className="text-xs text-white mt-1">
                          {file.progress}%
                        </span>
                      </div>
                    )}
                    {file.status === "done" && (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    )}
                    {file.status === "error" && (
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    )}
                  </div>

                  {/* Remove Button (only for pending) */}
                  {file.status === "pending" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-stone-50">
          <div className="text-sm text-stone-500">
            {files.length > 0 && (
              <>
                {pendingCount > 0 && `${pendingCount} 個待上傳`}
                {doneCount > 0 && ` · ${doneCount} 個已完成`}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800"
            >
              取消
            </button>
            <button
              onClick={handleUpload}
              disabled={pendingCount === 0 || isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  上傳中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  上傳 ({pendingCount})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
