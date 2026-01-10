import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

// 上傳單個檔案，帶重試機制
async function uploadWithRetry(
  key: string,
  body: Buffer,
  contentType: string,
  maxRetries = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await S3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
      return;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      // 等待後重試
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

export interface ImageVariant {
  suffix: string;
  width: number;
}

export interface ImageVariants {
  thumb: string;
  sm: string;
  md: string;
  lg: string;
  original: string;
}

export interface ProcessedImage {
  variants: ImageVariants;
  width: number;
  height: number;
  size: number;
}

// 尺寸定義
const VARIANTS: ImageVariant[] = [
  { suffix: "thumb", width: 256 },
  { suffix: "sm", width: 640 },
  { suffix: "md", width: 1200 },
  { suffix: "lg", width: 1920 },
];

/**
 * 處理圖片並上傳多種尺寸到 R2
 * 使用順序上傳避免 SSL 連線問題
 */
export async function processAndUploadImage(
  buffer: Buffer,
  baseKey: string,
  originalFilename: string
): Promise<ProcessedImage> {
  // 取得原圖資訊
  const metadata = await sharp(buffer).metadata();
  const originalWidth = metadata.width || 1920;
  const originalHeight = metadata.height || 1080;

  // 產生 base key (不含副檔名)
  const keyWithoutExt = baseKey.replace(/\.[^.]+$/, "");

  const variants: Partial<ImageVariants> = {};

  // 先處理所有尺寸的圖片（不上傳）
  const processedImages: Array<{
    key: string;
    buffer: Buffer;
    suffix: string;
    url: string;
  }> = [];

  for (const variant of VARIANTS) {
    // 如果原圖比目標尺寸小，跳過這個尺寸
    if (originalWidth <= variant.width) {
      continue;
    }

    const variantKey = `${keyWithoutExt}-${variant.suffix}.webp`;
    const variantUrl = `${process.env.R2_PUBLIC_URL}/${variantKey}`;

    const processedBuffer = await sharp(buffer)
      .resize(variant.width, null, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: 85 })
      .toBuffer();

    processedImages.push({
      key: variantKey,
      buffer: processedBuffer,
      suffix: variant.suffix,
      url: variantUrl,
    });
  }

  // 處理原圖（壓縮為 WebP）
  const originalKey = `${keyWithoutExt}.webp`;
  const originalUrl = `${process.env.R2_PUBLIC_URL}/${originalKey}`;
  const originalBuffer = await sharp(buffer).webp({ quality: 90 }).toBuffer();

  // 順序上傳所有圖片（避免並行連線問題）
  for (const img of processedImages) {
    await uploadWithRetry(img.key, img.buffer, "image/webp");
    variants[img.suffix as keyof ImageVariants] = img.url;
  }

  // 上傳原圖
  await uploadWithRetry(originalKey, originalBuffer, "image/webp");
  variants.original = originalUrl;

  // 填充未生成的尺寸（使用最接近的較大尺寸）
  const finalVariants: ImageVariants = {
    thumb: variants.thumb || variants.sm || variants.md || variants.lg || variants.original!,
    sm: variants.sm || variants.md || variants.lg || variants.original!,
    md: variants.md || variants.lg || variants.original!,
    lg: variants.lg || variants.original!,
    original: variants.original!,
  };

  return {
    variants: finalVariants,
    width: originalWidth,
    height: originalHeight,
    size: originalBuffer.length,
  };
}

/**
 * 根據目標寬度選擇最適合的圖片 URL
 */
export function getOptimalImageUrl(
  variants: ImageVariants | null,
  originalUrl: string,
  targetWidth: number
): string {
  if (!variants) return originalUrl;

  if (targetWidth <= 256) return variants.thumb;
  if (targetWidth <= 640) return variants.sm;
  if (targetWidth <= 1200) return variants.md;
  if (targetWidth <= 1920) return variants.lg;
  return variants.original;
}

/**
 * 產生 srcSet 字串供 <img> 或 Next/Image 使用
 */
export function generateSrcSet(variants: ImageVariants | null, originalUrl: string): string {
  if (!variants) return originalUrl;

  const srcSetParts = [
    `${variants.thumb} 256w`,
    `${variants.sm} 640w`,
    `${variants.md} 1200w`,
    `${variants.lg} 1920w`,
  ];

  return srcSetParts.join(", ");
}
