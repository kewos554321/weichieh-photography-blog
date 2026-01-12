"use client";

import { Globe, Lock } from "lucide-react";

export type Visibility = "public" | "private";

interface VisibilitySettingsProps {
  visibility: Visibility;
  onVisibilityChange: (visibility: Visibility) => void;
  label?: string;
  description?: string;
  radioName?: string;
  disabled?: boolean;
  publicLabel?: string;
  publicDescription?: string;
  privateLabel?: string;
  privateDescription?: string;
  className?: string;
}

export function VisibilitySettings({
  visibility,
  onVisibilityChange,
  label = "可見性設定",
  description = "私人內容需透過 Token 管理頁面分享給特定訪客",
  radioName = "visibility",
  disabled = false,
  publicLabel = "公開",
  publicDescription = "顯示在列表，所有人可見",
  privateLabel = "私人",
  privateDescription = "僅授權的訪客可見",
  className = "",
}: VisibilitySettingsProps) {
  return (
    <div className={`p-4 bg-blue-50 rounded-lg space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-stone-500">{description}</p>
      )}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={radioName}
            value="public"
            checked={visibility === "public"}
            onChange={() => onVisibilityChange("public")}
            disabled={disabled}
            className="text-blue-600"
          />
          <Globe className="w-4 h-4 text-green-600" />
          <span className="text-sm text-stone-700">{publicLabel}</span>
          {publicDescription && (
            <span className="text-xs text-stone-400">- {publicDescription}</span>
          )}
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={radioName}
            value="private"
            checked={visibility === "private"}
            onChange={() => onVisibilityChange("private")}
            disabled={disabled}
            className="text-blue-600"
          />
          <Lock className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-stone-700">{privateLabel}</span>
          {privateDescription && (
            <span className="text-xs text-stone-400">- {privateDescription}</span>
          )}
        </label>
      </div>
    </div>
  );
}
