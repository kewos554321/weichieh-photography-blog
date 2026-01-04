export interface WatermarkSettings {
  enabled: boolean;
  type: "text" | "logo";
  text: string;
  logoUrl: string | null;
  position: WatermarkPosition;
  opacity: number; // 0-100
  size: "small" | "medium" | "large";
  padding: number; // pixels from edge
}

export type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export const defaultWatermarkSettings: WatermarkSettings = {
  enabled: false,
  type: "text",
  text: "© My Photography",
  logoUrl: null,
  position: "bottom-right",
  opacity: 30,
  size: "medium",
  padding: 20,
};

// Size multipliers based on image width
const sizeMultipliers = {
  small: 0.015,
  medium: 0.025,
  large: 0.04,
};

export async function applyWatermark(
  file: File,
  settings: WatermarkSettings
): Promise<File> {
  if (!settings.enabled) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Calculate position
        const { x, y, textAlign, textBaseline } = calculatePosition(
          canvas.width,
          canvas.height,
          settings.position,
          settings.padding
        );

        // Apply watermark
        if (settings.type === "text" && settings.text) {
          await applyTextWatermark(ctx, settings, canvas.width, x, y, textAlign, textBaseline);
        } else if (settings.type === "logo" && settings.logoUrl) {
          ctx.textAlign = textAlign;
          await applyLogoWatermark(ctx, settings, canvas.width, x, y);
        }

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }
            const watermarkedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(watermarkedFile);
          },
          file.type,
          0.95 // JPEG quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

function calculatePosition(
  canvasWidth: number,
  canvasHeight: number,
  position: WatermarkPosition,
  padding: number
): { x: number; y: number; textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline } {
  let x = 0;
  let y = 0;
  let textAlign: CanvasTextAlign = "left";
  let textBaseline: CanvasTextBaseline = "top";

  // Horizontal position
  if (position.includes("left")) {
    x = padding;
    textAlign = "left";
  } else if (position.includes("right")) {
    x = canvasWidth - padding;
    textAlign = "right";
  } else {
    x = canvasWidth / 2;
    textAlign = "center";
  }

  // Vertical position
  if (position.startsWith("top")) {
    y = padding;
    textBaseline = "top";
  } else if (position.startsWith("bottom")) {
    y = canvasHeight - padding;
    textBaseline = "bottom";
  } else {
    y = canvasHeight / 2;
    textBaseline = "middle";
  }

  return { x, y, textAlign, textBaseline };
}

async function applyTextWatermark(
  ctx: CanvasRenderingContext2D,
  settings: WatermarkSettings,
  canvasWidth: number,
  x: number,
  y: number,
  textAlign: CanvasTextAlign,
  textBaseline: CanvasTextBaseline
): Promise<void> {
  const fontSize = Math.round(canvasWidth * sizeMultipliers[settings.size]);

  ctx.font = `${fontSize}px "Georgia", serif`;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
  ctx.globalAlpha = settings.opacity / 100;

  // Shadow for better visibility
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = fontSize * 0.1;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // White text with shadow
  ctx.fillStyle = "white";
  ctx.fillText(settings.text, x, y);

  // Reset
  ctx.globalAlpha = 1;
  ctx.shadowColor = "transparent";
}

async function applyLogoWatermark(
  ctx: CanvasRenderingContext2D,
  settings: WatermarkSettings,
  canvasWidth: number,
  x: number,
  y: number
): Promise<void> {
  // Note: logoUrl is already validated by the caller
  const logo = new Image();
  logo.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    logo.onload = () => resolve();
    logo.onerror = () => reject(new Error("Failed to load logo"));
    logo.src = settings.logoUrl!;
  });

  // Calculate logo size based on image width
  const maxWidth = canvasWidth * sizeMultipliers[settings.size] * 10;
  const scale = Math.min(maxWidth / logo.width, 1);
  const logoWidth = logo.width * scale;
  const logoHeight = logo.height * scale;

  // Adjust position for logo dimensions based on alignment
  let drawX = x;
  let drawY = y;

  // Horizontal adjustment
  if (ctx.textAlign === "center") {
    drawX = x - logoWidth / 2;
  } else if (ctx.textAlign === "right") {
    drawX = x - logoWidth;
  }

  // Vertical adjustment
  if (settings.position.startsWith("bottom")) {
    drawY = y - logoHeight;
  } else if (settings.position.includes("center") && !settings.position.includes("left") && !settings.position.includes("right")) {
    drawY = y - logoHeight / 2;
  }

  ctx.globalAlpha = settings.opacity / 100;

  // Add shadow for visibility
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.drawImage(logo, drawX, drawY, logoWidth, logoHeight);

  // Reset
  ctx.globalAlpha = 1;
  ctx.shadowColor = "transparent";
}
