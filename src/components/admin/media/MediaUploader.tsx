"use client";

import { useState, useCallback, useRef } from "react";
import {
  X,
  Upload,
  Loader2,
  ImageIcon,
  FolderOpen,
} from "lucide-react";
import { useUpload } from "../upload";

// ============================================================================
// Types
// ============================================================================

interface FileWithPath {
  file: File;
  folderPath: string;
}

interface MediaUploaderProps {
  onClose: () => void;
  onComplete?: () => void;
  folderId?: number | null;
}

// ============================================================================
// Helper Functions - Folder Reading
// ============================================================================

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
            readBatch();
          }
        },
        (error) => reject(error)
      );
    };

    readBatch();
  });
}

function fileEntryToFile(fileEntry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
}

async function readEntriesRecursively(
  entry: FileSystemEntry,
  basePath: string = ""
): Promise<FileWithPath[]> {
  const results: FileWithPath[] = [];

  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    try {
      const file = await fileEntryToFile(fileEntry);
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

// ============================================================================
// Preview Item Component
// ============================================================================

interface PreviewFile {
  id: string;
  file: File;
  preview: string;
  folderPath?: string;
}

function PreviewItem({
  item,
  onRemove,
}: {
  item: PreviewFile;
  onRemove: () => void;
}) {
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.preview}
        alt={item.file.name}
        className="w-full h-full object-cover"
      />

      {/* Folder Path Badge */}
      {item.folderPath && (
        <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center gap-1 text-[10px] text-white/90 truncate">
            <FolderOpen className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{item.folderPath}</span>
          </div>
        </div>
      )}

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MediaUploader({ onClose, onComplete, folderId }: MediaUploaderProps) {
  const { addFiles, addFilesWithPath } = useUpload();

  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID
  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add files to preview (without folder path)
  const addToPreview = useCallback((files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith("image/"));

    const newItems: PreviewFile[] = validFiles.map((file) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setPreviewFiles((prev) => [...prev, ...newItems]);
  }, []);

  // Add files with folder path to preview
  const addToPreviewWithPath = useCallback((filesWithPath: FileWithPath[]) => {
    const newItems: PreviewFile[] = filesWithPath.map(({ file, folderPath }) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      folderPath: folderPath || undefined,
    }));

    setPreviewFiles((prev) => [...prev, ...newItems]);
  }, []);

  // Remove file from preview
  const removeFromPreview = useCallback((id: string) => {
    setPreviewFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // Handle file drop
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const items = e.dataTransfer.items;
      if (!items || items.length === 0) {
        if (e.dataTransfer.files) {
          addToPreview(Array.from(e.dataTransfer.files));
        }
        return;
      }

      setIsProcessingDrop(true);

      try {
        const allFilesWithPath: FileWithPath[] = [];
        const regularFiles: File[] = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const entry = item.webkitGetAsEntry?.();

          if (entry) {
            if (entry.isDirectory) {
              const filesFromDir = await readEntriesRecursively(entry, "");
              allFilesWithPath.push(...filesFromDir);
            } else if (entry.isFile) {
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

        if (allFilesWithPath.length > 0) {
          addToPreviewWithPath(allFilesWithPath);
        }
        if (regularFiles.length > 0) {
          addToPreview(regularFiles);
        }
      } catch (error) {
        console.error("Failed to process drop:", error);
        if (e.dataTransfer.files) {
          addToPreview(Array.from(e.dataTransfer.files));
        }
      } finally {
        setIsProcessingDrop(false);
      }
    },
    [addToPreview, addToPreviewWithPath]
  );

  // Start upload
  const handleUpload = useCallback(() => {
    if (previewFiles.length === 0) return;

    const filesWithPath = previewFiles.filter((f) => f.folderPath);
    const filesWithoutPath = previewFiles.filter((f) => !f.folderPath);

    // Add to upload queue via context
    if (filesWithPath.length > 0) {
      addFilesWithPath(
        filesWithPath.map((f) => ({ file: f.file, folderPath: f.folderPath! })),
        folderId || null
      );
    }

    if (filesWithoutPath.length > 0) {
      addFiles(
        filesWithoutPath.map((f) => f.file),
        folderId || null
      );
    }

    // Clean up previews (context will create new ones)
    previewFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    setPreviewFiles([]);

    // Close modal and notify completion
    onClose();
    onComplete?.();
  }, [previewFiles, folderId, addFiles, addFilesWithPath, onClose, onComplete]);

  // Folder stats
  const uniqueFolders = new Set(
    previewFiles.filter((f) => f.folderPath).map((f) => f.folderPath)
  );
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
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
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
              onChange={(e) => {
                if (e.target.files) {
                  addToPreview(Array.from(e.target.files));
                }
              }}
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

          {/* Preview Grid */}
          {previewFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {previewFiles.map((item) => (
                <PreviewItem
                  key={item.id}
                  item={item}
                  onRemove={() => removeFromPreview(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-stone-50">
          <div className="text-sm text-stone-500">
            {previewFiles.length > 0 && (
              <>
                {previewFiles.length} 個檔案
                {folderCount > 0 && ` · ${folderCount} 個資料夾`}
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
              disabled={previewFiles.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              開始上傳 ({previewFiles.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
