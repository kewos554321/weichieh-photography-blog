"use client";

import { useState } from "react";

interface UploadResult {
  publicUrl: string;
  key: string;
}

interface BatchUploadResult {
  filename: string;
  publicUrl: string;
  key: string;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = async (
    file: File,
    folder: "photos" | "articles" = "photos"
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. 取得 presigned URL
      setProgress(10);
      const presignResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder,
        }),
      });

      if (!presignResponse.ok) {
        const data = await presignResponse.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { presignedUrl, publicUrl, key } = await presignResponse.json();
      setProgress(30);

      // 2. 上傳到 R2
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      setProgress(100);
      return { publicUrl, key };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadBatch = async (
    files: File[],
    folder: "photos" | "articles" = "photos",
    onFileProgress?: (index: number, total: number, filename: string) => void
  ): Promise<BatchUploadResult[]> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. 批次取得 presigned URLs
      const fileInfos = files.map((file) => ({
        filename: file.name,
        contentType: file.type,
      }));

      const presignResponse = await fetch("/api/upload/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: fileInfos, folder }),
      });

      if (!presignResponse.ok) {
        const data = await presignResponse.json();
        throw new Error(data.error || "Failed to get batch upload URLs");
      }

      const { uploads } = await presignResponse.json();
      setProgress(10);

      // 2. 並行上傳所有檔案
      const results: BatchUploadResult[] = [];
      let completed = 0;

      const uploadPromises = uploads.map(
        async (
          uploadInfo: { presignedUrl: string; publicUrl: string; key: string; filename: string },
          index: number
        ) => {
          const file = files[index];

          const uploadResponse = await fetch(uploadInfo.presignedUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          completed++;
          const progressPercent = 10 + Math.round((completed / files.length) * 90);
          setProgress(progressPercent);
          onFileProgress?.(completed, files.length, file.name);

          return {
            filename: file.name,
            publicUrl: uploadInfo.publicUrl,
            key: uploadInfo.key,
          };
        }
      );

      const allResults = await Promise.all(uploadPromises);
      setProgress(100);
      return allResults;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Batch upload failed";
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setProgress(0);
    setError(null);
  };

  return { upload, uploadBatch, isUploading, progress, error, reset };
}
