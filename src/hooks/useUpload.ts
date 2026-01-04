"use client";

import { useState } from "react";
import { applyWatermark, WatermarkSettings } from "@/lib/watermark";

interface UploadResult {
  publicUrl: string;
  key: string;
}

interface BatchUploadResult {
  filename: string;
  publicUrl: string;
  key: string;
}

interface UploadOptions {
  applyWatermark?: boolean;
}

// Cache watermark settings for the session
let cachedWatermarkSettings: WatermarkSettings | null = null;

// For testing purposes only
export function resetWatermarkCache() {
  cachedWatermarkSettings = null;
}

async function getWatermarkSettings(): Promise<WatermarkSettings | null> {
  if (cachedWatermarkSettings) return cachedWatermarkSettings;

  try {
    const res = await fetch("/api/settings/watermark");
    if (res.ok) {
      cachedWatermarkSettings = await res.json();
      return cachedWatermarkSettings;
    }
  } catch {
    console.error("Failed to fetch watermark settings");
  }
  return null;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = async (
    file: File,
    folder: "photos" | "articles" = "photos",
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      let fileToUpload = file;

      // Apply watermark if enabled and it's a photo
      if (options.applyWatermark && folder === "photos" && file.type.startsWith("image/")) {
        const settings = await getWatermarkSettings();
        if (settings?.enabled) {
          setProgress(5);
          fileToUpload = await applyWatermark(file, settings);
        }
      }

      // 1. 取得 presigned URL
      setProgress(10);
      const presignResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: fileToUpload.name,
          contentType: fileToUpload.type,
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
        body: fileToUpload,
        headers: {
          "Content-Type": fileToUpload.type,
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
    onFileProgress?: (index: number, total: number, filename: string) => void,
    options: UploadOptions = {}
  ): Promise<BatchUploadResult[]> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Apply watermark if enabled
      let filesToUpload = files;
      if (options.applyWatermark && folder === "photos") {
        const settings = await getWatermarkSettings();
        if (settings?.enabled) {
          setProgress(2);
          filesToUpload = await Promise.all(
            files.map(async (file) => {
              if (file.type.startsWith("image/")) {
                return await applyWatermark(file, settings);
              }
              return file;
            })
          );
          setProgress(5);
        }
      }

      // 1. 批次取得 presigned URLs
      const fileInfos = filesToUpload.map((file) => ({
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
      let completed = 0;

      const uploadPromises = uploads.map(
        async (
          uploadInfo: { presignedUrl: string; publicUrl: string; key: string; filename: string },
          index: number
        ) => {
          const file = filesToUpload[index];

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
          const progressPercent = 10 + Math.round((completed / filesToUpload.length) * 90);
          setProgress(progressPercent);
          onFileProgress?.(completed, filesToUpload.length, file.name);

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
