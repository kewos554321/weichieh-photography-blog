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
  FolderOpen,
} from "lucide-react";

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  folderPath?: string; // 來源資料夾路徑
}

interface FileWithPath {
  file: File;
  folderPath: string;
}

// 讀取 FileSystemDirectoryEntry 內的所有項目
function readDirectoryEntries(
  dirReader: FileSystemDirectoryReader
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const allEntries: FileSystemEntry[] = [];

    const readBatch = () => {
      dirReader.readEntries(
        (entries) => {
          if (entries.length === 0) {
            resolve(allEntries);
          } else {
            allEntries.push(...entries);
            readBatch(); // 繼續讀取（每次最多100個）
          }
        },
        (error) => reject(error)
      );
    };

    readBatch();
  });
}

// 將 FileSystemFileEntry 轉換為 File
function fileEntryToFile(fileEntry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
}

// 遞迴讀取資料夾內所有圖片檔案
async function readEntriesRecursively(
  entry: FileSystemEntry,
  basePath: string = ""
): Promise<FileWithPath[]> {
  const results: FileWithPath[] = [];

  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    try {
      const file = await fileEntryToFile(fileEntry);
      // 只處理圖片檔案
      if (file.type.startsWith("image/")) {
        results.push({ file, folderPath: basePath });
      }
    } catch (error) {
      console.error("Failed to read file:", entry.name, error);
    }
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const dirReader = dirEntry.createReader();
    const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;

    try {
      const entries = await readDirectoryEntries(dirReader);
      for (const childEntry of entries) {
        const childResults = await readEntriesRecursively(childEntry, currentPath);
        results.push(...childResults);
      }
    } catch (error) {
      console.error("Failed to read directory:", entry.name, error);
    }
  }

  return results;
}

interface MediaUploaderProps {
  onClose: () => void;
  onComplete: () => void;
  folderId?: number | null;
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

export function MediaUploader({ onClose, onComplete, folderId }: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 添加普通檔案（無資料夾路徑）
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

  // 添加帶資料夾路徑的檔案
  const addFilesWithPath = useCallback((filesWithPath: FileWithPath[]) => {
    const uploadFiles: UploadFile[] = filesWithPath.map(({ file, folderPath }) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
      progress: 0,
      folderPath: folderPath || undefined,
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
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const items = e.dataTransfer.items;
      if (!items || items.length === 0) {
        // Fallback: 使用 files（不支援資料夾）
        if (e.dataTransfer.files) {
          addFiles(e.dataTransfer.files);
        }
        return;
      }

      setIsProcessingDrop(true);

      try {
        const allFilesWithPath: FileWithPath[] = [];
        const regularFiles: File[] = [];

        // 處理所有拖放項目
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const entry = item.webkitGetAsEntry?.();

          if (entry) {
            if (entry.isDirectory) {
              // 遞迴讀取資料夾
              const filesFromDir = await readEntriesRecursively(entry, "");
              allFilesWithPath.push(...filesFromDir);
            } else if (entry.isFile) {
              // 單一檔案
              const fileEntry = entry as FileSystemFileEntry;
              try {
                const file = await fileEntryToFile(fileEntry);
                if (file.type.startsWith("image/")) {
                  regularFiles.push(file);
                }
              } catch (error) {
                console.error("Failed to read file:", error);
              }
            }
          }
        }

        // 添加檔案
        if (allFilesWithPath.length > 0) {
          addFilesWithPath(allFilesWithPath);
        }
        if (regularFiles.length > 0) {
          addFiles(regularFiles);
        }
      } catch (error) {
        console.error("Failed to process drop:", error);
        // Fallback
        if (e.dataTransfer.files) {
          addFiles(e.dataTransfer.files);
        }
      } finally {
        setIsProcessingDrop(false);
      }
    },
    [addFiles, addFilesWithPath]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // 建立資料夾並返回 ID（支援階層結構）
  const createFolderHierarchy = async (
    folderPath: string,
    baseParentId: number | null,
    folderCache: Map<string, number>
  ): Promise<number | null> => {
    if (!folderPath) return baseParentId;

    // 檢查快取
    const cacheKey = `${baseParentId || "root"}:${folderPath}`;
    if (folderCache.has(cacheKey)) {
      return folderCache.get(cacheKey)!;
    }

    const parts = folderPath.split("/");
    let currentParentId = baseParentId;

    for (let i = 0; i < parts.length; i++) {
      const partPath = parts.slice(0, i + 1).join("/");
      const partCacheKey = `${baseParentId || "root"}:${partPath}`;

      if (folderCache.has(partCacheKey)) {
        currentParentId = folderCache.get(partCacheKey)!;
        continue;
      }

      const folderName = parts[i];
      try {
        const res = await fetch("/api/media/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: folderName,
            parentId: currentParentId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          currentParentId = data.id;
          folderCache.set(partCacheKey, data.id);
        } else if (res.status === 409) {
          // 資料夾已存在，查詢現有資料夾
          const searchParams = new URLSearchParams({
            parentId: currentParentId?.toString() || "null",
          });
          const listRes = await fetch(`/api/media/folders?${searchParams}`);
          if (listRes.ok) {
            const folders = await listRes.json();
            const existing = folders.find(
              (f: { name: string; id: number }) => f.name === folderName
            );
            if (existing) {
              currentParentId = existing.id;
              folderCache.set(partCacheKey, existing.id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to create folder:", folderName, error);
      }
    }

    return currentParentId;
  };

  const uploadFile = async (
    uploadFile: UploadFile,
    targetFolderId: number | null
  ): Promise<boolean> => {
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
          ...(targetFolderId && { folderId: targetFolderId }),
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

    // 收集所有不重複的資料夾路徑
    const uniqueFolderPaths = new Set<string>();
    pendingFiles.forEach((f) => {
      if (f.folderPath) {
        uniqueFolderPaths.add(f.folderPath);
      }
    });

    // 建立資料夾快取 (path -> folderId)
    const folderCache = new Map<string, number>();

    // 預先建立所有需要的資料夾
    for (const path of uniqueFolderPaths) {
      await createFolderHierarchy(path, folderId || null, folderCache);
    }

    // Upload files sequentially
    for (const file of pendingFiles) {
      // 決定目標資料夾 ID
      let targetFolderId = folderId || null;
      if (file.folderPath) {
        const cacheKey = `${folderId || "root"}:${file.folderPath}`;
        if (folderCache.has(cacheKey)) {
          targetFolderId = folderCache.get(cacheKey)!;
        }
      }
      await uploadFile(file, targetFolderId);
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

  // 統計資料夾數量
  const uniqueFolders = new Set(files.filter((f) => f.folderPath).map((f) => f.folderPath));
  const folderCount = uniqueFolders.size;

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
            onClick={() => !isProcessingDrop && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isProcessingDrop
                ? "border-stone-300 bg-stone-50 cursor-wait"
                : isDragging
                  ? "border-stone-500 bg-stone-50 cursor-copy"
                  : "border-stone-200 hover:border-stone-300 cursor-pointer"
            }`}
          >
            {isProcessingDrop ? (
              <>
                <Loader2 className="w-12 h-12 mx-auto text-stone-400 mb-3 animate-spin" />
                <p className="text-stone-600 mb-1">正在讀取資料夾內容...</p>
                <p className="text-sm text-stone-400">請稍候</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                <p className="text-stone-600 mb-1">
                  拖放圖片或資料夾到此處，或點擊選擇檔案
                </p>
                <p className="text-sm text-stone-400">
                  支援 JPG, PNG, WebP, GIF 格式 · 可拖放整個資料夾
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Folder Info Banner */}
          {folderCount > 0 && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <FolderOpen className="w-4 h-4 flex-shrink-0" />
              <span>
                偵測到 {folderCount} 個資料夾，上傳時將自動建立對應的資料夾結構
              </span>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group"
                >
                  <Image
                    src={file.preview}
                    alt={file.file.name}
                    fill
                    className="object-cover"
                  />

                  {/* Folder Path Badge */}
                  {file.folderPath && file.status === "pending" && (
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/70 to-transparent">
                      <div className="flex items-center gap-1 text-[10px] text-white/90 truncate">
                        <FolderOpen className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{file.folderPath}</span>
                      </div>
                    </div>
                  )}

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
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
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
                {folderCount > 0 && ` · ${folderCount} 個資料夾`}
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
