"use client";

import { useState, Suspense, useRef } from "react";
import Image from "next/image";
import { ImageIcon, X, FolderOpen, Loader2, Upload } from "lucide-react";
import { MediaLibraryContent } from "./MediaLibraryContent";
import type { Media } from "../types";

interface ReferenceImagePickerProps {
  value: string[];
  onChange: (urls: string[], mediaItems?: Media[]) => void;
  maxCount?: number;
  className?: string;
}

export function ReferenceImagePicker({
  value = [],
  onChange,
  maxCount = 5,
  className = "",
}: ReferenceImagePickerProps) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLibrarySelect = (media: Media | Media[]) => {
    if (Array.isArray(media)) {
      // Multi-select: merge with existing, respecting maxCount
      const newUrls = media.map((m) => m.url);
      const existingUrls = value.filter((url) => !newUrls.includes(url));
      const mergedUrls = [...existingUrls, ...newUrls].slice(0, maxCount);
      onChange(mergedUrls, media);
    } else {
      // Single item selection (shouldn't happen with multiSelect=true, but handle it)
      if (!value.includes(media.url) && value.length < maxCount) {
        onChange([...value, media.url], [media]);
      }
    }
  };

  const handleConfirmSelection = () => {
    setShowLibrary(false);
  };

  const handleRemove = (urlToRemove: string) => {
    const newUrls = value.filter((url) => url !== urlToRemove);
    onChange(newUrls);
  };

  const handleUpload = async (files: FileList) => {
    if (files.length === 0) return;

    const remainingSlots = maxCount - value.length;
    if (remainingSlots <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];

        // First, ensure article-references folder exists
        let folderId: number | null = null;
        try {
          // Try to get the folder first
          const folderRes = await fetch("/api/media/folders");
          if (folderRes.ok) {
            const folders = await folderRes.json();
            const existingFolder = folders.find(
              (f: { slug: string }) => f.slug === "article-references"
            );
            if (existingFolder) {
              folderId = existingFolder.id;
            } else {
              // Create the folder
              const createRes = await fetch("/api/media/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "article-references" }),
              });
              if (createRes.ok) {
                const newFolder = await createRes.json();
                folderId = newFolder.id;
              }
            }
          }
        } catch (error) {
          console.error("Folder handling error:", error);
        }

        // Get image dimensions
        const dimensions = await getImageDimensions(file);

        // Upload via media API (creates database record)
        const mediaRes = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
            width: dimensions.width,
            height: dimensions.height,
            folderId: folderId,
          }),
        });

        if (!mediaRes.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { presignedUrl, publicUrl } = await mediaRes.json();

        // Upload to R2
        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload file");
        }

        uploadedUrls.push(publicUrl);
        setUploadProgress(((i + 1) / filesToUpload.length) * 100);
      }

      // Merge uploaded URLs with existing
      onChange([...value, ...uploadedUrls]);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const canAddMore = value.length < maxCount;

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        {/* Selected Images Grid */}
        {value.length > 0 && (
          <div className="grid grid-cols-5 gap-2">
            {value.map((url, index) => (
              <div
                key={url}
                className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group"
              >
                <Image
                  src={url}
                  alt={`Reference ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  title="移除"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 rounded text-[10px] text-white">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {canAddMore && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              disabled={isUploading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-stone-300 rounded-lg text-stone-500 hover:border-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm">從媒體庫選擇</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-stone-300 rounded-lg text-stone-500 hover:border-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">上傳中 {Math.round(uploadProgress)}%</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">上傳圖片</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleUpload(e.target.files);
                }
                e.target.value = "";
              }}
              className="hidden"
            />
          </div>
        )}

        {/* Empty State */}
        {value.length === 0 && !canAddMore && (
          <div className="flex items-center justify-center py-8 text-stone-400">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}

        {/* Counter */}
        <div className="text-xs text-stone-400 text-center">
          已選擇 {value.length}/{maxCount} 張
        </div>
      </div>

      {/* Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-medium text-stone-900">
                  選擇參考圖片
                </h2>
                <p className="text-sm text-stone-500">
                  最多可選擇 {maxCount} 張圖片（已選 {value.length} 張）
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConfirmSelection}
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors text-sm"
                >
                  確認選擇
                </button>
                <button
                  onClick={() => setShowLibrary(false)}
                  className="p-1 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
                  </div>
                }
              >
                <MediaLibraryContent
                  selectable
                  multiSelect={true}
                  onSelect={handleLibrarySelect}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
