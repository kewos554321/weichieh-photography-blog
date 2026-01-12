import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import type { WatermarkSettings, WatermarkPosition } from "./watermark";
import { defaultWatermarkSettings } from "./watermark";

// 快取設定，避免每次上傳都查資料庫
let cachedSettings: WatermarkSettings | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 分鐘快取

/**
 * 從資料庫讀取浮水印設定（帶快取）
 */
export async function getServerWatermarkSettings(): Promise<WatermarkSettings> {
  const now = Date.now();

  if (cachedSettings && now - cacheTime < CACHE_TTL) {
    return cachedSettings;
  }

  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: "watermark" },
    });

    cachedSettings = settings
      ? { ...defaultWatermarkSettings, ...(settings.value as object) }
      : defaultWatermarkSettings;
    cacheTime = now;

    return cachedSettings;
  } catch {
    return defaultWatermarkSettings;
  }
}

/**
 * 清除設定快取（設定更新時呼叫）
 */
export function clearWatermarkCache(): void {
  cachedSettings = null;
  cacheTime = 0;
}

// 尺寸係數（與客戶端一致）
const sizeMultipliers = {
  small: 0.015,
  medium: 0.025,
  large: 0.04,
};

// 位置映射到 Sharp gravity
function positionToGravity(position: WatermarkPosition): string {
  const map: Record<WatermarkPosition, string> = {
    "top-left": "northwest",
    "top-center": "north",
    "top-right": "northeast",
    "center-left": "west",
    center: "center",
    "center-right": "east",
    "bottom-left": "southwest",
    "bottom-center": "south",
    "bottom-right": "southeast",
  };
  return map[position];
}

/**
 * 生成文字浮水印 SVG
 */
function generateTextWatermarkSvg(
  settings: WatermarkSettings,
  imageWidth: number,
  imageHeight: number
): string {
  const fontSize = Math.round(imageWidth * sizeMultipliers[settings.size]);
  const opacity = settings.opacity / 100;

  // 計算文字位置
  let x: number;
  let y: number;
  let textAnchor: string;
  let dominantBaseline: string;

  const padding = settings.padding;

  // 水平位置
  if (settings.position.includes("left")) {
    x = padding;
    textAnchor = "start";
  } else if (settings.position.includes("right")) {
    x = imageWidth - padding;
    textAnchor = "end";
  } else {
    x = imageWidth / 2;
    textAnchor = "middle";
  }

  // 垂直位置
  if (settings.position.startsWith("top")) {
    y = padding + fontSize;
    dominantBaseline = "text-before-edge";
  } else if (settings.position.startsWith("bottom")) {
    y = imageHeight - padding;
    dominantBaseline = "text-after-edge";
  } else {
    y = imageHeight / 2;
    dominantBaseline = "middle";
  }

  // 轉義 XML 特殊字元
  const escapedText = settings.text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  return `
    <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <text
        x="${x}"
        y="${y}"
        font-family="Georgia, serif"
        font-size="${fontSize}"
        fill="white"
        fill-opacity="${opacity}"
        text-anchor="${textAnchor}"
        dominant-baseline="${dominantBaseline}"
        filter="url(#shadow)"
      >${escapedText}</text>
    </svg>
  `;
}

/**
 * 套用伺服器端浮水印
 */
export async function applyServerWatermark(
  buffer: Buffer,
  settings: WatermarkSettings
): Promise<Buffer> {
  if (!settings.enabled) {
    return buffer;
  }

  const image = sharp(buffer);
  const metadata = await image.metadata();
  const width = metadata.width || 1920;
  const height = metadata.height || 1080;

  if (settings.type === "text" && settings.text) {
    // 文字浮水印
    const svg = generateTextWatermarkSvg(settings, width, height);

    return image
      .composite([
        {
          input: Buffer.from(svg),
          top: 0,
          left: 0,
        },
      ])
      .toBuffer();
  } else if (settings.type === "logo" && settings.logoUrl) {
    // Logo 浮水印
    try {
      const response = await fetch(settings.logoUrl);
      if (!response.ok) {
        console.error("Failed to fetch logo:", settings.logoUrl);
        return buffer;
      }

      const logoBuffer = Buffer.from(await response.arrayBuffer());

      // 計算 Logo 尺寸
      const maxWidth = Math.round(width * sizeMultipliers[settings.size] * 10);
      const logoImage = sharp(logoBuffer);
      const logoMeta = await logoImage.metadata();

      const scale = Math.min(maxWidth / (logoMeta.width || maxWidth), 1);
      const logoWidth = Math.round((logoMeta.width || maxWidth) * scale);
      const logoHeight = Math.round((logoMeta.height || maxWidth) * scale);

      // 調整 Logo 大小並設定透明度
      const resizedLogo = await logoImage
        .resize(logoWidth, logoHeight, { fit: "inside" })
        .ensureAlpha()
        .modulate({ brightness: 1 })
        .composite([
          {
            input: Buffer.from(
              `<svg><rect x="0" y="0" width="${logoWidth}" height="${logoHeight}" fill="white" fill-opacity="${settings.opacity / 100}"/></svg>`
            ),
            blend: "dest-in",
          },
        ])
        .toBuffer();

      return image
        .composite([
          {
            input: resizedLogo,
            gravity: positionToGravity(settings.position) as
              | "center"
              | "north"
              | "northeast"
              | "east"
              | "southeast"
              | "south"
              | "southwest"
              | "west"
              | "northwest",
          },
        ])
        .toBuffer();
    } catch (error) {
      console.error("Failed to apply logo watermark:", error);
      return buffer;
    }
  }

  return buffer;
}
