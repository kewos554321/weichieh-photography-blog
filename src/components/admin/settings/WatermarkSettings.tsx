"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Save, Droplets, Type, Image as ImageIcon, Eye } from "lucide-react";
import type { WatermarkSettings as WatermarkSettingsType, WatermarkPosition } from "@/lib/watermark";

const positions: { value: WatermarkPosition; label: string }[] = [
  { value: "top-left", label: "↖ Top Left" },
  { value: "top-center", label: "↑ Top Center" },
  { value: "top-right", label: "↗ Top Right" },
  { value: "center-left", label: "← Center Left" },
  { value: "center", label: "⊙ Center" },
  { value: "center-right", label: "→ Center Right" },
  { value: "bottom-left", label: "↙ Bottom Left" },
  { value: "bottom-center", label: "↓ Bottom Center" },
  { value: "bottom-right", label: "↘ Bottom Right" },
];

// Size multipliers for preview (same as watermark.ts)
const sizeMultipliers = {
  small: 0.015,
  medium: 0.025,
  large: 0.04,
};

export function WatermarkSettings() {
  const [settings, setSettings] = useState<WatermarkSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewImageLoaded, setPreviewImageLoaded] = useState(false);
  const previewImageRef = useRef<HTMLImageElement | null>(null);

  // Load sample preview image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      previewImageRef.current = img;
      setPreviewImageLoaded(true);
    };
    // Use a sample landscape image for preview
    img.src = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop";
  }, []);

  // Draw watermark preview
  const drawPreview = useCallback(() => {
    if (!canvasRef.current || !previewImageRef.current || !settings) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = previewImageRef.current;

    // Set canvas size to match container aspect ratio
    const containerWidth = 400;
    const containerHeight = 300;
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Draw image scaled to fill canvas
    const scale = Math.max(containerWidth / img.width, containerHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - scaledHeight) / 2;

    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

    // Only draw watermark if enabled
    if (!settings.enabled) return;

    // Calculate position
    const padding = settings.padding * (containerWidth / 1000); // Scale padding for preview
    let x = 0;
    let y = 0;
    let textAlign: CanvasTextAlign = "left";
    let textBaseline: CanvasTextBaseline = "top";

    // Horizontal position
    if (settings.position.includes("left")) {
      x = padding;
      textAlign = "left";
    } else if (settings.position.includes("right")) {
      x = containerWidth - padding;
      textAlign = "right";
    } else {
      x = containerWidth / 2;
      textAlign = "center";
    }

    // Vertical position
    if (settings.position.startsWith("top")) {
      y = padding;
      textBaseline = "top";
    } else if (settings.position.startsWith("bottom")) {
      y = containerHeight - padding;
      textBaseline = "bottom";
    } else {
      y = containerHeight / 2;
      textBaseline = "middle";
    }

    // Draw text watermark
    if (settings.type === "text" && settings.text) {
      const fontSize = Math.round(containerWidth * sizeMultipliers[settings.size]);

      ctx.font = `${fontSize}px "Georgia", serif`;
      ctx.textAlign = textAlign;
      ctx.textBaseline = textBaseline;
      ctx.globalAlpha = settings.opacity / 100;

      // Shadow for better visibility
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = fontSize * 0.1;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // White text
      ctx.fillStyle = "white";
      ctx.fillText(settings.text, x, y);

      // Reset
      ctx.globalAlpha = 1;
      ctx.shadowColor = "transparent";
    }
  }, [settings]);

  // Redraw preview when settings change
  useEffect(() => {
    if (previewImageLoaded) {
      drawPreview();
    }
  }, [previewImageLoaded, drawPreview]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/watermark");
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error("Failed to fetch watermark settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/watermark", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      setMessage({ type: "success", text: "設定已儲存" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save:", error);
      setMessage({ type: "error", text: "儲存失敗，請稍後再試" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Watermark Settings
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Configure watermark for uploaded photos
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg mb-6 ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Preview Section */}
      <div className="mb-6 bg-white rounded-xl border border-stone-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-stone-600" />
          <h3 className="font-medium text-stone-900">即時預覽</h3>
          {!settings.enabled && (
            <span className="text-xs text-stone-400 ml-2">(浮水印已停用)</span>
          )}
        </div>
        <div className="flex justify-center">
          <div className="relative rounded-lg overflow-hidden shadow-lg border border-stone-200">
            {!previewImageLoaded ? (
              <div className="w-[400px] h-[300px] bg-stone-100 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="block"
              />
            )}
          </div>
        </div>
        <p className="text-xs text-stone-500 text-center mt-3">
          調整下方設定即可看到即時預覽效果
        </p>
      </div>

      <div className="space-y-6 bg-white rounded-xl border border-stone-200 p-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-stone-900">啟用浮水印</label>
            <p className="text-sm text-stone-500">上傳照片時自動套用浮水印</p>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.enabled ? "bg-green-500" : "bg-stone-300"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.enabled ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        {settings.enabled && (
          <>
            {/* Type Selection */}
            <div>
              <label className="block font-medium text-stone-900 mb-3">浮水印類型</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, type: "text" })}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    settings.type === "text"
                      ? "border-stone-900 bg-stone-50"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <Type className="w-5 h-5" />
                  <span>文字浮水印</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, type: "logo" })}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    settings.type === "logo"
                      ? "border-stone-900 bg-stone-50"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span>Logo 圖片</span>
                </button>
              </div>
            </div>

            {/* Text Settings */}
            {settings.type === "text" && (
              <div>
                <label className="block font-medium text-stone-900 mb-2">浮水印文字</label>
                <input
                  type="text"
                  value={settings.text}
                  onChange={(e) => setSettings({ ...settings, text: e.target.value })}
                  placeholder="e.g. © My Photography"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                />
              </div>
            )}

            {/* Logo Settings */}
            {settings.type === "logo" && (
              <div>
                <label className="block font-medium text-stone-900 mb-2">Logo URL</label>
                <input
                  type="url"
                  value={settings.logoUrl || ""}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value || null })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                />
                <p className="text-xs text-stone-500 mt-1">
                  建議使用透明背景的 PNG 圖片
                </p>
                {settings.logoUrl && (
                  <div className="mt-3 p-3 bg-stone-100 rounded-lg inline-block">
                    <Image
                      src={settings.logoUrl}
                      alt="Logo preview"
                      width={100}
                      height={50}
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Position */}
            <div>
              <label className="block font-medium text-stone-900 mb-3">位置</label>
              <div className="grid grid-cols-3 gap-2">
                {positions.map((pos) => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => setSettings({ ...settings, position: pos.value })}
                    className={`p-2 text-sm rounded-lg border-2 transition-colors ${
                      settings.position === pos.value
                        ? "border-stone-900 bg-stone-50 font-medium"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="block font-medium text-stone-900 mb-3">大小</label>
              <div className="grid grid-cols-3 gap-3">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSettings({ ...settings, size })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      settings.size === size
                        ? "border-stone-900 bg-stone-50"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <span className={`block ${
                      size === "small" ? "text-sm" : size === "medium" ? "text-base" : "text-lg"
                    }`}>
                      {size === "small" ? "小" : size === "medium" ? "中" : "大"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="block font-medium text-stone-900 mb-2">
                透明度: {settings.opacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.opacity}
                onChange={(e) => setSettings({ ...settings, opacity: parseInt(e.target.value) })}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
              />
              <div className="flex justify-between text-xs text-stone-500 mt-1">
                <span>完全透明</span>
                <span>完全不透明</span>
              </div>
            </div>

            {/* Padding */}
            <div>
              <label className="block font-medium text-stone-900 mb-2">
                邊距: {settings.padding}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.padding}
                onChange={(e) => setSettings({ ...settings, padding: parseInt(e.target.value) })}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
              />
            </div>

            {/* Tips */}
            <div className="p-4 bg-stone-50 rounded-lg">
              <p className="text-sm text-stone-600">
                💡 建議使用 20-40% 透明度，避免影響照片觀看體驗。
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
