/**
 * 浮水印類型定義
 * 實際處理邏輯在 serverWatermark.ts（伺服器端）
 */

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

// 尺寸係數（供預覽組件使用）
export const sizeMultipliers = {
  small: 0.015,
  medium: 0.025,
  large: 0.04,
};
