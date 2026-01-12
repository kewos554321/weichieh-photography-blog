"use client";

import Image, { ImageProps } from "next/image";
import { ImageVariants } from "@/components/admin/types";

interface OptimizedImageProps extends Omit<ImageProps, "src"> {
  src: string;
  variants?: ImageVariants | null;
  size?: "thumb" | "sm" | "md" | "lg" | "original";
}

/**
 * OptimizedImage - 根據尺寸自動選擇最適合的圖片 URL
 *
 * 如果有 variants，會根據 size prop 或 width 自動選擇：
 * - thumb: 256px (縮圖、grid view)
 * - sm: 640px (小卡片、mobile)
 * - md: 1200px (中型顯示、tablet)
 * - lg: 1920px (大圖、desktop)
 * - original: 原始尺寸
 *
 * 如果沒有 variants，會 fallback 到原始 src
 */
export function OptimizedImage({
  src,
  variants,
  size,
  width,
  ...props
}: OptimizedImageProps) {
  // 根據 size prop 或 width 選擇適當的 variant
  const getOptimalSrc = (): string => {
    if (!variants) return src;

    // 如果指定了 size，直接使用
    if (size) {
      return variants[size] || src;
    }

    // 根據 width 自動選擇
    const numWidth = typeof width === "number" ? width : parseInt(width as string) || 0;

    if (numWidth <= 256) return variants.thumb;
    if (numWidth <= 640) return variants.sm;
    if (numWidth <= 1200) return variants.md;
    if (numWidth <= 1920) return variants.lg;
    return variants.original;
  };

  // 產生 srcSet for responsive images
  const getSrcSet = (): string | undefined => {
    if (!variants) return undefined;

    return [
      `${variants.thumb} 256w`,
      `${variants.sm} 640w`,
      `${variants.md} 1200w`,
      `${variants.lg} 1920w`,
    ].join(", ");
  };

  const optimalSrc = getOptimalSrc();

  // Next.js Image 不支援 srcSet prop，所以我們用 loader 來處理
  // 但如果要用原生 srcSet，需要用 unoptimized
  return (
    <Image
      {...props}
      src={optimalSrc}
      width={width}
      unoptimized // 因為我們已經在 server 處理過了
    />
  );
}

/**
 * 取得適當尺寸的圖片 URL (for non-React usage)
 */
export function getOptimalImageUrl(
  src: string,
  variants: ImageVariants | null | undefined,
  targetWidth: number
): string {
  if (!variants) return src;

  if (targetWidth <= 256) return variants.thumb;
  if (targetWidth <= 640) return variants.sm;
  if (targetWidth <= 1200) return variants.md;
  if (targetWidth <= 1920) return variants.lg;
  return variants.original;
}

/**
 * 產生 srcSet 字串
 */
export function generateSrcSet(
  variants: ImageVariants | null | undefined
): string | undefined {
  if (!variants) return undefined;

  return [
    `${variants.thumb} 256w`,
    `${variants.sm} 640w`,
    `${variants.md} 1200w`,
    `${variants.lg} 1920w`,
  ].join(", ");
}
