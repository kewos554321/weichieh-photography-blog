/**
 * 圖片上傳工具函數
 */

interface UploadResult {
  filename: string;
  presignedUrl: string;
  publicUrl: string;
  key: string;
}

interface BatchUploadResponse {
  success: boolean;
  count: number;
  uploads: UploadResult[];
}

/**
 * 單張圖片上傳
 */
export async function uploadSingleImage(
  file: File,
  folder: string = "photos"
): Promise<string> {
  // 1. 取得 presigned URL
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      folder,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get upload URL");
  }

  const { presignedUrl, publicUrl } = await response.json();

  // 2. 上傳檔案到 R2
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

  return publicUrl;
}

/**
 * 批次圖片上傳
 */
export async function uploadBatchImages(
  files: File[],
  folder: string = "photos",
  onProgress?: (uploaded: number, total: number) => void
): Promise<string[]> {
  if (files.length === 0) return [];

  // 1. 批次取得 presigned URLs
  const fileInfos = files.map((file) => ({
    filename: file.name,
    contentType: file.type,
  }));

  const response = await fetch("/api/upload/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: fileInfos, folder }),
  });

  if (!response.ok) {
    throw new Error("Failed to get batch upload URLs");
  }

  const data: BatchUploadResponse = await response.json();

  // 2. 並行上傳所有檔案
  let uploadedCount = 0;
  const publicUrls: string[] = [];

  const uploadPromises = data.uploads.map(async (uploadInfo, index) => {
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

    uploadedCount++;
    onProgress?.(uploadedCount, files.length);

    return uploadInfo.publicUrl;
  });

  const results = await Promise.all(uploadPromises);
  return results;
}

/**
 * 批次圖片上傳（依序，較慢但穩定）
 */
export async function uploadBatchImagesSequential(
  files: File[],
  folder: string = "photos",
  onProgress?: (uploaded: number, total: number, currentFile: string) => void
): Promise<string[]> {
  const publicUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i, files.length, file.name);

    const publicUrl = await uploadSingleImage(file, folder);
    publicUrls.push(publicUrl);

    onProgress?.(i + 1, files.length, file.name);
  }

  return publicUrls;
}

/**
 * 驗證圖片檔案
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `不支援的檔案格式: ${file.type}` };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: `檔案過大: ${(file.size / 1024 / 1024).toFixed(1)}MB (上限 10MB)` };
  }

  return { valid: true };
}

/**
 * 批次驗證圖片檔案
 */
export function validateImageFiles(files: File[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  files.forEach((file, index) => {
    const result = validateImageFile(file);
    if (!result.valid) {
      errors.push(`${file.name}: ${result.error}`);
    }
  });

  return { valid: errors.length === 0, errors };
}
