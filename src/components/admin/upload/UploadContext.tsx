"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

// ============================================================================
// Types
// ============================================================================

export type UploadStatus = "pending" | "uploading" | "done" | "error" | "paused";

export interface UploadItem {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  folderPath?: string;
  targetFolderId: number | null;
  retryCount: number;
}

export interface UploadBatch {
  id: string;
  name: string;
  items: UploadItem[];
  createdAt: Date;
  baseFolderId: number | null;
}

interface UploadContextValue {
  // State
  batches: UploadBatch[];
  isUploading: boolean;
  isPaused: boolean;
  isMinimized: boolean;
  lastCompletedAt: number | null;

  // Actions
  addFiles: (files: File[], baseFolderId: number | null, batchName?: string) => void;
  addFilesWithPath: (
    files: Array<{ file: File; folderPath: string }>,
    baseFolderId: number | null,
    batchName?: string
  ) => void;
  pauseAll: () => void;
  resumeAll: () => void;
  cancelAll: () => void;
  cancelBatch: (batchId: string) => void;
  retryFailed: () => void;
  retryItem: (batchId: string, itemId: string) => void;
  removeItem: (batchId: string, itemId: string) => void;
  clearCompleted: () => void;
  setMinimized: (minimized: boolean) => void;

  // Computed
  totalItems: number;
  completedItems: number;
  failedItems: number;
  overallProgress: number;
}

// ============================================================================
// Context
// ============================================================================

const UploadContext = createContext<UploadContextValue | null>(null);

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within UploadProvider");
  }
  return context;
}

// ============================================================================
// Helper Functions
// ============================================================================

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

// Create folder hierarchy and return folder ID
async function createFolderHierarchy(
  folderPath: string,
  baseParentId: number | null,
  folderCache: Map<string, number>
): Promise<number | null> {
  if (!folderPath) return baseParentId;

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
}

// ============================================================================
// Provider
// ============================================================================

const CONCURRENCY = 3; // Reduced to avoid R2 rate limiting
const MAX_RETRIES = 3;
const UPLOAD_TIMEOUT = 60000; // 60 seconds timeout per file

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastCompletedAt, setLastCompletedAt] = useState<number | null>(null);

  const isProcessingRef = useRef(false);
  const folderCacheRef = useRef(new Map<string, number>());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Computed values
  const allItems = batches.flatMap((b) => b.items);
  const totalItems = allItems.length;
  const completedItems = allItems.filter((i) => i.status === "done").length;
  const failedItems = allItems.filter((i) => i.status === "error").length;
  const pendingOrUploading = allItems.filter(
    (i) => i.status === "pending" || i.status === "uploading"
  ).length;
  const isUploading = pendingOrUploading > 0 && !isPaused;

  const overallProgress =
    totalItems > 0
      ? Math.round(
          allItems.reduce((acc, item) => {
            if (item.status === "done") return acc + 100;
            if (item.status === "error") return acc + 100;
            return acc + item.progress;
          }, 0) / totalItems
        )
      : 0;

  // Generate unique ID
  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Update item in batches
  const updateItem = useCallback(
    (batchId: string, itemId: string, updates: Partial<UploadItem>) => {
      setBatches((prev) =>
        prev.map((batch) =>
          batch.id === batchId
            ? {
                ...batch,
                items: batch.items.map((item) =>
                  item.id === itemId ? { ...item, ...updates } : item
                ),
              }
            : batch
        )
      );
    },
    []
  );

  // Upload single file
  const uploadSingleFile = useCallback(
    async (
      batch: UploadBatch,
      item: UploadItem,
      signal: AbortSignal
    ): Promise<boolean> => {
      try {
        // Update status to uploading
        updateItem(batch.id, item.id, { status: "uploading", progress: 10 });

        // Check if aborted
        if (signal.aborted) {
          updateItem(batch.id, item.id, { status: "paused", progress: 0 });
          return false;
        }

        // Get target folder ID (create if needed)
        let targetFolderId = item.targetFolderId;
        if (item.folderPath) {
          targetFolderId = await createFolderHierarchy(
            item.folderPath,
            batch.baseFolderId,
            folderCacheRef.current
          );
        }

        // Get image dimensions
        const { width, height } = await getImageDimensions(item.file);
        updateItem(batch.id, item.id, { progress: 20 });

        if (signal.aborted) {
          updateItem(batch.id, item.id, { status: "paused", progress: 0 });
          return false;
        }

        // Create media record and get presigned URL
        const res = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: item.file.name,
            contentType: item.file.type,
            size: item.file.size,
            width,
            height,
            ...(targetFolderId && { folderId: targetFolderId }),
          }),
          signal,
        });

        if (!res.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { presignedUrl } = await res.json();
        updateItem(batch.id, item.id, { progress: 40 });

        if (signal.aborted) {
          updateItem(batch.id, item.id, { status: "paused", progress: 0 });
          return false;
        }

        // Upload to R2 with timeout
        const uploadController = new AbortController();
        const timeoutId = setTimeout(() => {
          uploadController.abort();
        }, UPLOAD_TIMEOUT);

        // Combine signals: parent abort and timeout
        const combinedSignal = signal.aborted ? signal : uploadController.signal;
        signal.addEventListener("abort", () => uploadController.abort());

        try {
          const uploadRes = await fetch(presignedUrl, {
            method: "PUT",
            body: item.file,
            headers: { "Content-Type": item.file.type },
            signal: combinedSignal,
          });

          clearTimeout(timeoutId);
          if (!uploadRes.ok) {
            throw new Error("Failed to upload file");
          }
        } catch (err) {
          clearTimeout(timeoutId);
          if (uploadController.signal.aborted && !signal.aborted) {
            throw new Error("Upload timeout - file too large or slow connection");
          }
          throw err;
        }

        updateItem(batch.id, item.id, { status: "done", progress: 100 });
        setLastCompletedAt(Date.now());
        return true;
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          updateItem(batch.id, item.id, { status: "paused", progress: 0 });
          return false;
        }

        updateItem(batch.id, item.id, {
          status: "error",
          progress: 0,
          error: error instanceof Error ? error.message : "Upload failed",
          retryCount: item.retryCount + 1,
        });
        return false;
      }
    },
    [updateItem]
  );

  // Process upload queue - use ref to get latest batches
  const batchesRef = useRef<UploadBatch[]>([]);
  batchesRef.current = batches;

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || isPaused) return;
    isProcessingRef.current = true;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Continuous upload: maintain CONCURRENCY active uploads at all times
    const activeUploads = new Set<Promise<void>>();

    const getNextPendingItem = (): { batch: UploadBatch; item: UploadItem } | null => {
      for (const batch of batchesRef.current) {
        for (const item of batch.items) {
          if (item.status === "pending") {
            return { batch, item };
          }
        }
      }
      return null;
    };

    const startUpload = async (batch: UploadBatch, item: UploadItem): Promise<void> => {
      await uploadSingleFile(batch, item, signal);
    };

    try {
      // Initial: start up to CONCURRENCY uploads
      let nextItem = getNextPendingItem();

      while (nextItem || activeUploads.size > 0) {
        if (signal.aborted) break;

        // Fill up to CONCURRENCY slots
        while (nextItem && activeUploads.size < CONCURRENCY) {
          const { batch, item } = nextItem;
          // Mark as uploading immediately to prevent re-picking
          item.status = "uploading";

          const uploadPromise = startUpload(batch, item).finally(() => {
            activeUploads.delete(uploadPromise);
          });
          activeUploads.add(uploadPromise);

          nextItem = getNextPendingItem();
        }

        // Wait for at least one to complete before continuing
        if (activeUploads.size > 0) {
          await Promise.race(activeUploads);
          // Check for new pending items after each completion
          nextItem = getNextPendingItem();
        }
      }

    } finally {
      isProcessingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [isPaused, uploadSingleFile]);

  // Start processing when batches change
  useEffect(() => {
    const hasPending = batches.some((b) =>
      b.items.some((i) => i.status === "pending")
    );
    if (hasPending && !isPaused) {
      // Use setTimeout to ensure state is fully committed before processing
      setTimeout(() => {
        processQueue();
      }, 0);
    }
  }, [batches, isPaused, processQueue]);

  // Add files without folder path
  const addFiles = useCallback(
    (files: File[], baseFolderId: number | null, batchName?: string) => {
      const validFiles = files.filter((f) => f.type.startsWith("image/"));
      if (validFiles.length === 0) return;

      const items: UploadItem[] = validFiles.map((file) => ({
        id: generateId(),
        file,
        preview: URL.createObjectURL(file),
        status: "pending" as const,
        progress: 0,
        targetFolderId: baseFolderId,
        retryCount: 0,
      }));

      const batch: UploadBatch = {
        id: generateId(),
        name: batchName || `Upload ${new Date().toLocaleTimeString()}`,
        items,
        createdAt: new Date(),
        baseFolderId,
      };

      setBatches((prev) => [...prev, batch]);
      setIsMinimized(false);
    },
    []
  );

  // Add files with folder path
  const addFilesWithPath = useCallback(
    (
      files: Array<{ file: File; folderPath: string }>,
      baseFolderId: number | null,
      batchName?: string
    ) => {
      const validFiles = files.filter((f) => f.file.type.startsWith("image/"));
      if (validFiles.length === 0) return;

      const items: UploadItem[] = validFiles.map(({ file, folderPath }) => ({
        id: generateId(),
        file,
        preview: URL.createObjectURL(file),
        status: "pending" as const,
        progress: 0,
        folderPath: folderPath || undefined,
        targetFolderId: baseFolderId,
        retryCount: 0,
      }));

      // Group by folder for batch name
      const folders = new Set(files.map((f) => f.folderPath).filter(Boolean));
      const folderNames = Array.from(folders).slice(0, 2).join(", ");

      const batch: UploadBatch = {
        id: generateId(),
        name:
          batchName ||
          (folderNames
            ? `${folderNames}${folders.size > 2 ? ` (+${folders.size - 2})` : ""}`
            : `Upload ${new Date().toLocaleTimeString()}`),
        items,
        createdAt: new Date(),
        baseFolderId,
      };

      setBatches((prev) => {
        return [...prev, batch];
      });
      setIsMinimized(false);
    },
    []
  );

  // Pause all uploads
  const pauseAll = useCallback(() => {
    setIsPaused(true);
    abortControllerRef.current?.abort();

    // Mark uploading items as paused
    setBatches((prev) =>
      prev.map((batch) => ({
        ...batch,
        items: batch.items.map((item) =>
          item.status === "uploading"
            ? { ...item, status: "paused" as const, progress: 0 }
            : item
        ),
      }))
    );
  }, []);

  // Resume all uploads
  const resumeAll = useCallback(() => {
    // Change paused items back to pending
    setBatches((prev) =>
      prev.map((batch) => ({
        ...batch,
        items: batch.items.map((item) =>
          item.status === "paused"
            ? { ...item, status: "pending" as const }
            : item
        ),
      }))
    );
    setIsPaused(false);
  }, []);

  // Cancel all uploads
  const cancelAll = useCallback(() => {
    abortControllerRef.current?.abort();

    // Clean up previews
    batches.forEach((batch) => {
      batch.items.forEach((item) => {
        if (item.status !== "done") {
          URL.revokeObjectURL(item.preview);
        }
      });
    });

    setBatches([]);
    setIsPaused(false);
  }, [batches]);

  // Cancel specific batch
  const cancelBatch = useCallback((batchId: string) => {
    setBatches((prev) => {
      const batch = prev.find((b) => b.id === batchId);
      if (batch) {
        batch.items.forEach((item) => {
          if (item.status !== "done") {
            URL.revokeObjectURL(item.preview);
          }
        });
      }
      return prev.filter((b) => b.id !== batchId);
    });
  }, []);

  // Retry all failed items
  const retryFailed = useCallback(() => {
    setBatches((prev) =>
      prev.map((batch) => ({
        ...batch,
        items: batch.items.map((item) =>
          item.status === "error" && item.retryCount < MAX_RETRIES
            ? { ...item, status: "pending" as const, error: undefined }
            : item
        ),
      }))
    );
  }, []);

  // Retry specific item
  const retryItem = useCallback((batchId: string, itemId: string) => {
    setBatches((prev) =>
      prev.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              items: batch.items.map((item) =>
                item.id === itemId && item.retryCount < MAX_RETRIES
                  ? { ...item, status: "pending" as const, error: undefined }
                  : item
              ),
            }
          : batch
      )
    );
  }, []);

  // Remove specific item
  const removeItem = useCallback((batchId: string, itemId: string) => {
    setBatches((prev) =>
      prev
        .map((batch) => {
          if (batch.id !== batchId) return batch;

          const item = batch.items.find((i) => i.id === itemId);
          if (item && item.status !== "done") {
            URL.revokeObjectURL(item.preview);
          }

          return {
            ...batch,
            items: batch.items.filter((i) => i.id !== itemId),
          };
        })
        .filter((batch) => batch.items.length > 0)
    );
  }, []);

  // Clear completed items
  const clearCompleted = useCallback(() => {
    setBatches((prev) =>
      prev
        .map((batch) => ({
          ...batch,
          items: batch.items.filter((item) => item.status !== "done"),
        }))
        .filter((batch) => batch.items.length > 0)
    );
  }, []);

  const value: UploadContextValue = {
    batches,
    isUploading,
    isPaused,
    isMinimized,
    lastCompletedAt,
    addFiles,
    addFilesWithPath,
    pauseAll,
    resumeAll,
    cancelAll,
    cancelBatch,
    retryFailed,
    retryItem,
    removeItem,
    clearCompleted,
    setMinimized: setIsMinimized,
    totalItems,
    completedItems,
    failedItems,
    overallProgress,
  };

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
}
