"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import type { Media, PhotoTag } from "../types";
import {
  X,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Camera,
  ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";

interface BatchPublishPhotosModalProps {
  mediaItems: Media[];
  onClose: () => void;
  onComplete: () => void;
}

interface PhotoFormItem {
  mediaId: number;
  mediaUrl: string;
  mediaFilename: string;
  title: string;
  slug: string;
  category: string;
  location: string;
  date: string;
  story: string;
  camera: string;
  lens: string;
  tags: string[];
  prompt: string; // Individual prompt for this photo
  isGenerating: boolean;
  isExpanded: boolean;
  isPublished: boolean;
  error?: string;
}

const CATEGORIES = ["Portrait", "Landscape", "Street", "Nature", "Architecture", "Documentary", "Abstract"];

export function BatchPublishPhotosModal({
  mediaItems,
  onClose,
  onComplete,
}: BatchPublishPhotosModalProps) {
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [globalPrompt, setGlobalPrompt] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [localTags, setLocalTags] = useState<PhotoTag[]>([]);

  // Initialize form items from media
  const [formItems, setFormItems] = useState<PhotoFormItem[]>(
    mediaItems.map((media) => ({
      mediaId: media.id,
      mediaUrl: media.url,
      mediaFilename: media.filename,
      title: "",
      slug: "",
      category: CATEGORIES[0],
      location: "",
      date: new Date().toISOString().split("T")[0],
      story: "",
      camera: "",
      lens: "",
      tags: [],
      prompt: "",
      isGenerating: false,
      isExpanded: false,
      isPublished: false,
      error: undefined,
    }))
  );

  // Fetch existing tags on mount
  useState(() => {
    fetch("/api/photos/tags")
      .then((res) => res.json())
      .then((data) => setLocalTags(data))
      .catch(() => setLocalTags([]));
  });

  const updateFormItem = useCallback((index: number, updates: Partial<PhotoFormItem>) => {
    setFormItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }, []);

  const toggleExpand = (index: number) => {
    updateFormItem(index, { isExpanded: !formItems[index].isExpanded });
  };

  // AI Generate for single item
  const handleGenerateForItem = async (index: number) => {
    const item = formItems[index];
    updateFormItem(index, { isGenerating: true, error: undefined });

    // Merge global prompt + individual prompt
    const finalPrompt = [globalPrompt, item.prompt].filter(Boolean).join("。");

    try {
      const res = await fetch("/api/ai/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: item.mediaUrl,
          prompt: finalPrompt || undefined,
          language: "zh",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI 生成失敗");
      }

      const data = await res.json();

      // Generate unique slug
      const baseSlug = data.slug || data.title
        ?.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim() || "photo";
      const uniqueSlug = `${baseSlug}-${Date.now()}`;

      updateFormItem(index, {
        title: data.title || "",
        slug: uniqueSlug,
        story: data.story || "",
        category: data.category || CATEGORIES[0],
        location: data.location || "",
        date: data.date || new Date().toISOString().split("T")[0],
        camera: data.camera || "",
        lens: data.lens || "",
        tags: data.tags || [],
        isGenerating: false,
        isExpanded: true, // Expand to show results
      });
    } catch (err) {
      updateFormItem(index, {
        isGenerating: false,
        error: err instanceof Error ? err.message : "AI 生成失敗",
      });
    }
  };

  // AI Generate for all items
  const handleGenerateAll = async () => {
    // Process sequentially to avoid rate limiting
    for (let i = 0; i < formItems.length; i++) {
      if (!formItems[i].isPublished && !formItems[i].title) {
        await handleGenerateForItem(i);
        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  };

  // Check if form item is valid
  const isItemValid = (item: PhotoFormItem) => {
    return (
      item.title.trim() &&
      item.slug.trim() &&
      item.category &&
      item.location.trim() &&
      item.date &&
      item.story.trim()
    );
  };

  // Get missing fields for an item
  const getMissingFields = (item: PhotoFormItem): string[] => {
    const missing: string[] = [];
    if (!item.title.trim()) missing.push("title");
    if (!item.slug.trim()) missing.push("slug");
    if (!item.location.trim()) missing.push("location");
    if (!item.story.trim()) missing.push("story");
    return missing;
  };

  // Count valid items
  const validCount = formItems.filter((item) => isItemValid(item) && !item.isPublished).length;
  const publishedCount = formItems.filter((item) => item.isPublished).length;

  // Create or get tag ID
  const getOrCreateTagId = async (tagName: string): Promise<number | null> => {
    // Check existing
    const existing = localTags.find(
      (t) => t.name.toLowerCase() === tagName.toLowerCase()
    );
    if (existing) return existing.id;

    // Create new
    try {
      const res = await fetch("/api/photos/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName }),
      });
      if (res.ok) {
        const newTag = await res.json();
        setLocalTags((prev) => [...prev, newTag]);
        return newTag.id;
      }
    } catch {
      console.error("Failed to create tag:", tagName);
    }
    return null;
  };

  // Publish all valid items
  const handlePublishAll = async () => {
    const itemsToPublish = formItems.filter(
      (item) => isItemValid(item) && !item.isPublished
    );

    if (itemsToPublish.length === 0) return;

    setIsPublishing(true);
    setPublishProgress(0);

    let successCount = 0;

    for (let i = 0; i < formItems.length; i++) {
      const item = formItems[i];
      if (!isItemValid(item) || item.isPublished) continue;

      try {
        // Get tag IDs
        const tagIds: number[] = [];
        for (const tagName of item.tags) {
          const tagId = await getOrCreateTagId(tagName);
          if (tagId) tagIds.push(tagId);
        }

        // Create photo
        const res = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: item.slug,
            title: item.title,
            src: item.mediaUrl,
            category: item.category,
            location: item.location,
            date: item.date,
            story: item.story,
            camera: item.camera || null,
            lens: item.lens || null,
            tagIds,
            status,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "發布失敗");
        }

        updateFormItem(i, { isPublished: true, error: undefined });
        successCount++;
      } catch (err) {
        updateFormItem(i, {
          error: err instanceof Error ? err.message : "發布失敗",
        });
      }

      setPublishProgress(((i + 1) / formItems.length) * 100);
    }

    setIsPublishing(false);

    if (successCount === itemsToPublish.length) {
      // All successful
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  const isGeneratingAny = formItems.some((item) => item.isGenerating);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Camera className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                Batch Publish Photos
              </h2>
              <p className="text-sm text-stone-500">
                {mediaItems.length} photos selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPublishing}
            className="p-2 hover:bg-stone-100 rounded-full disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Prompt */}
        <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <label className="text-sm font-medium text-stone-700">
              Global Prompt
            </label>
            <span className="text-xs text-stone-400">(套用到所有照片)</span>
          </div>
          <textarea
            value={globalPrompt}
            onChange={(e) => setGlobalPrompt(e.target.value)}
            placeholder="例如：這些是在東京拍的街拍，使用 Sony A7IV，風格偏向電影感..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white resize-none"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-200">
          {/* Status Selection */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-600">Status:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={status === "draft"}
                onChange={() => setStatus("draft")}
                className="text-stone-900"
              />
              <EyeOff className="w-4 h-4 text-stone-500" />
              <span className="text-sm">Draft</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="published"
                checked={status === "published"}
                onChange={() => setStatus("published")}
                className="text-stone-900"
              />
              <Eye className="w-4 h-4 text-green-600" />
              <span className="text-sm">Published</span>
            </label>
          </div>

          {/* AI Fill All Button */}
          <button
            onClick={handleGenerateAll}
            disabled={isGeneratingAny || isPublishing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isGeneratingAny ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI 填充中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI Fill All
              </>
            )}
          </button>
        </div>

        {/* Photo List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {formItems.map((item, index) => (
            <div
              key={item.mediaId}
              className={`border rounded-lg overflow-hidden transition-all ${
                item.isPublished
                  ? "border-green-200 bg-green-50"
                  : item.error
                  ? "border-red-200 bg-red-50"
                  : isItemValid(item)
                  ? "border-stone-200 bg-white"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              {/* Item Header */}
              <div className="flex items-center gap-3 p-3">
                {/* Thumbnail */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                  <Image
                    src={item.mediaUrl}
                    alt={item.mediaFilename}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info + Prompt */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {item.title || item.mediaFilename}
                    </p>
                    {item.isPublished ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 flex-shrink-0">
                        <Check className="w-3 h-3" />
                        Published
                      </span>
                    ) : item.error ? (
                      <span className="flex items-center gap-1 text-xs text-red-600 flex-shrink-0">
                        <AlertCircle className="w-3 h-3" />
                        Error
                      </span>
                    ) : isItemValid(item) ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 flex-shrink-0">
                        <Check className="w-3 h-3" />
                        Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600 flex-shrink-0">
                        <AlertCircle className="w-3 h-3" />
                        Missing
                      </span>
                    )}
                  </div>
                  {/* Individual Prompt - Always visible */}
                  {!item.isPublished && (
                    <input
                      type="text"
                      value={item.prompt}
                      onChange={(e) =>
                        updateFormItem(index, { prompt: e.target.value })
                      }
                      className="w-full px-2 py-1 text-xs border border-purple-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-400 bg-purple-50/50"
                      placeholder="額外提示 (optional)：雨天、黃昏..."
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!item.isPublished && (
                    <button
                      onClick={() => handleGenerateForItem(index)}
                      disabled={item.isGenerating || isPublishing}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                      {item.isGenerating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      AI
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpand(index)}
                    className="p-1.5 hover:bg-stone-100 rounded-md"
                  >
                    {item.isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Form */}
              {item.isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-stone-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          updateFormItem(index, { title: e.target.value })
                        }
                        disabled={item.isPublished}
                        className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:bg-stone-100"
                        placeholder="Photo title..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Slug *
                      </label>
                      <input
                        type="text"
                        value={item.slug}
                        onChange={(e) =>
                          updateFormItem(index, { slug: e.target.value })
                        }
                        disabled={item.isPublished}
                        className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-md bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:bg-stone-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Category *
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) =>
                          updateFormItem(index, { category: e.target.value })
                        }
                        disabled={item.isPublished}
                        className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:bg-stone-100"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) =>
                          updateFormItem(index, { location: e.target.value })
                        }
                        disabled={item.isPublished}
                        className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:bg-stone-100"
                        placeholder="e.g. Tokyo, Japan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) =>
                          updateFormItem(index, { date: e.target.value })
                        }
                        disabled={item.isPublished}
                        className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:bg-stone-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Camera
                      </label>
                      <input
                        type="text"
                        value={item.camera}
                        onChange={(e) =>
                          updateFormItem(index, { camera: e.target.value })
                        }
                        disabled={item.isPublished}
                        className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:bg-stone-100"
                        placeholder="e.g. Sony A7IV"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Lens
                      </label>
                      <input
                        type="text"
                        value={item.lens}
                        onChange={(e) =>
                          updateFormItem(index, { lens: e.target.value })
                        }
                        disabled={item.isPublished}
                        className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:bg-stone-100"
                        placeholder="e.g. 85mm f/1.4"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      Story *
                    </label>
                    <textarea
                      value={item.story}
                      onChange={(e) =>
                        updateFormItem(index, { story: e.target.value })
                      }
                      disabled={item.isPublished}
                      rows={3}
                      className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 disabled:bg-stone-100"
                      placeholder="The story behind this photo..."
                    />
                  </div>

                  {item.tags.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar (when publishing) */}
        {isPublishing && (
          <div className="px-4 py-2 bg-stone-50 border-t border-stone-200">
            <div className="w-full bg-stone-200 rounded-full h-2">
              <div
                className="bg-stone-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${publishProgress}%` }}
              />
            </div>
            <p className="text-xs text-stone-500 mt-1 text-center">
              Publishing... {Math.round(publishProgress)}%
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-stone-200 bg-stone-50">
          <div className="text-sm text-stone-500">
            {publishedCount > 0 && (
              <span className="text-green-600">
                {publishedCount} published
              </span>
            )}
            {publishedCount > 0 && validCount > 0 && " • "}
            {validCount > 0 && (
              <span>
                {validCount} ready to publish
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isPublishing}
              className="px-4 py-2 text-stone-700 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {publishedCount === formItems.length ? "Done" : "Cancel"}
            </button>
            {publishedCount < formItems.length && (
              <button
                onClick={handlePublishAll}
                disabled={validCount === 0 || isPublishing || isGeneratingAny}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:bg-stone-400 disabled:cursor-not-allowed"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Publish {validCount} Photos
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
