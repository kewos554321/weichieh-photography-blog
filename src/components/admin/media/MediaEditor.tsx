"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  X,
  RotateCcw,
  RotateCw,
  Sun,
  Contrast,
  Droplets,
  Palette,
  Crop,
  Save,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { Media, FilterType } from "../types";

interface MediaEditorProps {
  media: Media;
  onClose: () => void;
  onSave: (media: Media) => void;
}

const ASPECT_RATIOS = [
  { label: "自由", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
];

const FILTERS: { id: FilterType; label: string; css: string }[] = [
  { id: "none", label: "原始", css: "" },
  { id: "bw", label: "黑白", css: "grayscale(100%)" },
  { id: "vintage", label: "復古", css: "sepia(40%) contrast(90%) brightness(90%)" },
  { id: "cinematic", label: "電影", css: "contrast(110%) saturate(85%) brightness(95%)" },
  { id: "warm", label: "暖色", css: "sepia(20%) saturate(110%)" },
  { id: "cool", label: "冷色", css: "saturate(90%) hue-rotate(10deg) brightness(105%)" },
];

type EditorTab = "crop" | "adjust" | "filter";

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
  brightness: number,
  contrast: number,
  saturation: number,
  filter: FilterType
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const rotRad = (rotation * Math.PI) / 180;

  // Calculate bounding box of the rotated image
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  const newWidth = image.width * cos + image.height * sin;
  const newHeight = image.width * sin + image.height * cos;

  // Set canvas size to cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Apply filters
  const filterCss = FILTERS.find((f) => f.id === filter)?.css || "";
  ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%) ${filterCss}`;

  // Draw rotated and cropped image
  ctx.save();
  ctx.translate(-pixelCrop.x, -pixelCrop.y);
  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas toBlob failed"));
        }
      },
      "image/jpeg",
      0.95
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

export function MediaEditor({ media, onClose, onSave }: MediaEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("crop");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [filter, setFilter] = useState<FilterType>("none");
  const [isSaving, setIsSaving] = useState(false);
  const [saveAsNew, setSaveAsNew] = useState(true);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleRotate = (direction: "cw" | "ccw") => {
    setRotation((prev) => {
      const newRotation = direction === "cw" ? prev + 90 : prev - 90;
      return newRotation % 360;
    });
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setFilter("none");
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsSaving(true);
    try {
      // Generate cropped and edited image
      const blob = await getCroppedImg(
        media.url,
        croppedAreaPixels,
        rotation,
        brightness,
        contrast,
        saturation,
        filter
      );

      // Get presigned URL for edited image
      const editRes = await fetch(`/api/media/${media.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saveAsNew,
          contentType: "image/jpeg",
          size: blob.size,
          width: croppedAreaPixels.width,
          height: croppedAreaPixels.height,
        }),
      });

      if (!editRes.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { presignedUrl, media: updatedMedia } = await editRes.json();

      // Upload edited image to R2
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload edited image");
      }

      onSave(updatedMedia);
    } catch (error) {
      console.error("Save error:", error);
      alert("儲存失敗");
    } finally {
      setIsSaving(false);
    }
  };

  // CSS filter for preview
  const filterCss = FILTERS.find((f) => f.id === filter)?.css || "";
  const previewFilter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%) ${filterCss}`;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-white font-medium">{media.filename}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-stone-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
            重設
          </button>
          <label className="flex items-center gap-2 text-sm text-stone-400">
            <input
              type="checkbox"
              checked={saveAsNew}
              onChange={(e) => setSaveAsNew(e.target.checked)}
              className="rounded"
            />
            另存新檔
          </label>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-stone-900 text-sm rounded-lg hover:bg-stone-100 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                儲存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                儲存
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Cropper Area */}
        <div className="flex-1 relative" style={{ filter: previewFilter }}>
          <Cropper
            image={media.url}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Controls Panel */}
        <div className="w-72 bg-stone-800 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-stone-700">
            {[
              { id: "crop" as EditorTab, label: "裁切", icon: Crop },
              { id: "adjust" as EditorTab, label: "調整", icon: Sun },
              { id: "filter" as EditorTab, label: "濾鏡", icon: Palette },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "text-white bg-stone-700"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Crop Tab */}
            {activeTab === "crop" && (
              <div className="space-y-6">
                {/* Aspect Ratio */}
                <div>
                  <h3 className="text-xs text-stone-400 uppercase tracking-wide mb-2">
                    比例
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.label}
                        onClick={() => setAspectRatio(ratio.value)}
                        className={`px-3 py-2 text-sm rounded transition-colors ${
                          aspectRatio === ratio.value
                            ? "bg-white text-stone-900"
                            : "bg-stone-700 text-stone-300 hover:bg-stone-600"
                        }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <h3 className="text-xs text-stone-400 uppercase tracking-wide mb-2">
                    旋轉
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRotate("ccw")}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-stone-700 text-stone-300 rounded hover:bg-stone-600"
                    >
                      <RotateCcw className="w-4 h-4" />
                      -90°
                    </button>
                    <button
                      onClick={() => handleRotate("cw")}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-stone-700 text-stone-300 rounded hover:bg-stone-600"
                    >
                      <RotateCw className="w-4 h-4" />
                      +90°
                    </button>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full mt-3"
                  />
                  <div className="text-center text-sm text-stone-400 mt-1">
                    {rotation}°
                  </div>
                </div>

                {/* Zoom */}
                <div>
                  <h3 className="text-xs text-stone-400 uppercase tracking-wide mb-2">
                    縮放
                  </h3>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-stone-400 mt-1">
                    {zoom.toFixed(1)}x
                  </div>
                </div>
              </div>
            )}

            {/* Adjust Tab */}
            {activeTab === "adjust" && (
              <div className="space-y-6">
                {/* Brightness */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm text-stone-300 flex items-center gap-1.5">
                      <Sun className="w-4 h-4" />
                      亮度
                    </h3>
                    <span className="text-sm text-stone-400">{brightness}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm text-stone-300 flex items-center gap-1.5">
                      <Contrast className="w-4 h-4" />
                      對比
                    </h3>
                    <span className="text-sm text-stone-400">{contrast}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm text-stone-300 flex items-center gap-1.5">
                      <Droplets className="w-4 h-4" />
                      飽和度
                    </h3>
                    <span className="text-sm text-stone-400">{saturation}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Filter Tab */}
            {activeTab === "filter" && (
              <div className="grid grid-cols-2 gap-3">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      filter === f.id
                        ? "border-white"
                        : "border-transparent hover:border-stone-500"
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${media.url})`,
                        filter: f.css || undefined,
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <span className="text-xs text-white">{f.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
