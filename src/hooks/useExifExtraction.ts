"use client";

import { useState, useCallback } from "react";
import { extractExif, ExifData } from "@/lib/exif";

interface UseExifExtractionResult {
  exifData: ExifData | null;
  isExtracting: boolean;
  error: string | null;
  extract: (file: File) => Promise<ExifData>;
  reset: () => void;
}

export function useExifExtraction(): UseExifExtractionResult {
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extract = useCallback(async (file: File): Promise<ExifData> => {
    setIsExtracting(true);
    setError(null);

    try {
      const data = await extractExif(file);
      setExifData(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to extract EXIF";
      setError(message);
      return {};
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setExifData(null);
    setError(null);
  }, []);

  return {
    exifData,
    isExtracting,
    error,
    extract,
    reset,
  };
}
