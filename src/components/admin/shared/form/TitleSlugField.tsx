"use client";

import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";

interface TitleSlugFieldProps {
  title: string;
  slug: string;
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
  type: "photo" | "post" | "album";
  isEditMode?: boolean;
  excludeSlug?: string;
  titleLabel?: string;
  slugLabel?: string;
  titlePlaceholder?: string;
  slugPlaceholder?: string;
  titleRequired?: boolean;
  slugRequired?: boolean;
  disabled?: boolean;
  showAiButton?: boolean;
  className?: string;
}

// Slug 生成邏輯
function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function TitleSlugField({
  title,
  slug,
  onTitleChange,
  onSlugChange,
  type,
  isEditMode = false,
  excludeSlug,
  titleLabel = "Title",
  slugLabel = "Slug",
  titlePlaceholder = "Enter title...",
  slugPlaceholder = "auto-generated-slug",
  titleRequired = true,
  slugRequired = true,
  disabled = false,
  showAiButton = true,
  className = "",
}: TitleSlugFieldProps) {
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);

  const handleTitleChange = (newTitle: string) => {
    onTitleChange(newTitle);
    // 編輯模式時不自動更新 slug
    if (!isEditMode) {
      onSlugChange(generateSlugFromTitle(newTitle));
    }
  };

  const handleGenerateSlug = async () => {
    if (!title.trim()) return;

    setIsGeneratingSlug(true);
    try {
      const response = await fetch("/api/ai/generate-slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          excludeSlug: isEditMode ? excludeSlug : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate slug");

      const data = await response.json();
      if (data.slug) {
        onSlugChange(data.slug);
      }
    } catch (err) {
      console.error("Generate slug error:", err);
    } finally {
      setIsGeneratingSlug(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          {titleLabel} {titleRequired && "*"}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          disabled={disabled}
          required={titleRequired}
          className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          {slugLabel} {slugRequired && "*"}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder={slugPlaceholder}
            disabled={disabled}
            required={slugRequired}
            className="flex-1 px-3 py-2 border border-stone-300 rounded-md bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {showAiButton && (
            <button
              type="button"
              onClick={handleGenerateSlug}
              disabled={isGeneratingSlug || !title.trim() || disabled}
              className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="AI 產生 Slug"
            >
              {isGeneratingSlug ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
