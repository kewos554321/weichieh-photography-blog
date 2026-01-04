"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useUpload } from "@/hooks/useUpload";
import {
  X,
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface BatchUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadFile {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  publicUrl?: string;
  error?: string;
}

export function BatchUploadModal({ onClose, onSuccess }: BatchUploadModalProps) {
  const { uploadBatch, isUploading, progress } = useUpload();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles = fileArray.filter((f) =>
      ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
    );

    const uploadFiles: UploadFile[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    // Mark all as uploading
    setFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" })));

    try {
      const results = await uploadBatch(
        files.map((f) => f.file),
        "photos",
        (completed) => {
          setCurrentFileIndex(completed);
          setFiles((prev) =>
            prev.map((f, i) =>
              i < completed ? { ...f, status: "done" } : f
            )
          );
        }
      );

      // 建立資料庫記錄
      const createPromises = results.map(async (result, index) => {
        const file = files[index].file;
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        const title = nameWithoutExt.replace(/[-_]/g, " ");
        const slug = nameWithoutExt
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-") + "-" + Date.now();

        await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            title,
            src: result.publicUrl,
            category: "Portrait",
            location: "未設定",
            date: new Date().toISOString().split("T")[0],
            story: "待編輯...",
            status: "draft",
          }),
        });
      });

      await Promise.all(createPromises);

      // Update with results
      setFiles((prev) =>
        prev.map((f, i) => ({
          ...f,
          status: "done",
          publicUrl: results[i]?.publicUrl,
        }))
      );
      setUploadComplete(true);
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? { ...f, status: "error", error: "Upload failed" }
            : f
        )
      );
    }
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Batch Upload Photos
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Drop Zone */}
          {!uploadComplete && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-stone-900 bg-stone-50"
                  : "border-stone-300 hover:border-stone-400"
              }`}
            >
              <Upload className="w-10 h-10 mx-auto text-stone-400 mb-3" />
              <p className="text-stone-600 mb-2">
                Drag and drop images here, or
              </p>
              <label className="inline-block px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 cursor-pointer transition-colors">
                Browse Files
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-stone-400 mt-3">
                Supports: JPEG, PNG, WebP, GIF (Max 20 files, 10MB each)
              </p>
            </div>
          )}

          {/* Preview Grid */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">
                  {files.length} file{files.length > 1 ? "s" : ""} selected
                </span>
                {!uploadComplete && !isUploading && (
                  <button
                    onClick={() => setFiles([])}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <Image
                      src={file.preview}
                      alt={file.file.name}
                      fill
                      className="object-cover"
                    />
                    {/* Status overlay */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center ${
                        file.status === "pending"
                          ? "bg-black/0 group-hover:bg-black/40"
                          : file.status === "uploading"
                          ? "bg-black/40"
                          : file.status === "done"
                          ? "bg-green-500/30"
                          : "bg-red-500/30"
                      }`}
                    >
                      {file.status === "pending" && !isUploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {file.status === "uploading" && (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {file.status === "done" && (
                        <CheckCircle className="w-8 h-8 text-white" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="w-8 h-8 text-white" />
                      )}
                    </div>
                    {/* Filename */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                      <p className="text-xs text-white truncate">
                        {file.file.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-stone-600">
                <span>Uploading...</span>
                <span>
                  {currentFileIndex} / {files.length}
                </span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2">
                <div
                  className="bg-stone-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadComplete && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Upload Complete!</p>
                <p className="text-sm">
                  {files.length} photos uploaded successfully. You can now edit
                  each photo to add details.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-4 border-t border-stone-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
          >
            {uploadComplete ? "Close" : "Cancel"}
          </button>
          {!uploadComplete && (
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
              className="px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors disabled:bg-stone-400"
            >
              {isUploading ? "Uploading..." : `Upload ${files.length} Photos`}
            </button>
          )}
          {uploadComplete && (
            <button
              onClick={onSuccess}
              className="px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
