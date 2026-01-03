"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { useUpload } from "@/hooks/useUpload";
import { useExifExtraction } from "@/hooks/useExifExtraction";
import type { Photo, PhotoTag, Category, Media } from "../types";
import { MediaLibraryContent } from "../media/MediaLibraryContent";
import {
  Plus,
  Search,
  X,
  Tag,
  Calendar,
  MapPin,
  Camera,
  Image as ImageIcon,
  FileText,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  Sparkles,
  Loader2,
  Globe,
  Upload,
  FolderOpen,
  Filter,
} from "lucide-react";

// Dynamic import for MapPickerModal to avoid SSR issues with Leaflet
const MapPickerModal = dynamic(
  () => import("@/components/MapPickerModal"),
  { ssr: false }
);

interface PhotoModalProps {
  photo: Photo | null;
  tags: PhotoTag[];
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ArticleOption {
  id: number;
  slug: string;
  title: string;
}

export function PhotoModal({ photo, tags, categories, onClose, onSuccess }: PhotoModalProps) {
  const { upload, isUploading, progress } = useUpload();
  const { extract: extractExif, isExtracting: isExtractingExif } = useExifExtraction();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    photo?.src || null
  );
  const [mediaUrl, setMediaUrl] = useState<string | null>(photo?.src || null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newTagName, setNewTagName] = useState("");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [localTags, setLocalTags] = useState<PhotoTag[]>(tags);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // 合併資料庫分類和預設分類
  const allCategories = categories.length > 0
    ? categories.map((c) => c.name)
    : ["Portrait", "Landscape", "Street", "Nature"];

  const [formData, setFormData] = useState({
    title: photo?.title || "",
    slug: photo?.slug || "",
    category: photo?.category || allCategories[0],
    location: photo?.location || "",
    latitude: photo?.latitude ?? null as number | null,
    longitude: photo?.longitude ?? null as number | null,
    date: photo?.date ? photo.date.split("T")[0] : "",
    camera: photo?.camera || "",
    lens: photo?.lens || "",
    story: photo?.story || "",
    behindTheScene: photo?.behindTheScene || "",
    image: null as File | null,
    tagIds: photo?.tags?.map((t) => t.id) || ([] as number[]),
    status: photo?.status || ("draft" as "draft" | "scheduled" | "published"),
    publishedAt: photo?.publishedAt
      ? photo.publishedAt.slice(0, 16)
      : "",
    articleId: (photo as Photo & { articleId?: number })?.articleId || null as number | null,
  });

  // 載入可選的文章列表
  useEffect(() => {
    fetch("/api/articles?admin=true&limit=100")
      .then((res) => res.json())
      .then((data) => setArticles(data.articles || []))
      .catch(() => setArticles([]));
  }, []);

  const isEditMode = !!photo;

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormData({ ...formData, title, slug: isEditMode ? formData.slug : slug });
  };

  const handleImageChange = async (file: File | null) => {
    setFormData((prev) => ({ ...prev, image: file }));
    setMediaUrl(null); // Clear media URL when uploading new file
    if (file) {
      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Extract EXIF data and auto-fill form
      const exif = await extractExif(file);
      if (Object.keys(exif).length > 0) {
        setFormData((prev) => ({
          ...prev,
          image: file,
          // Only fill if field is empty
          camera: prev.camera || exif.camera || "",
          lens: prev.lens || exif.lens || "",
          date: prev.date || exif.date || "",
          latitude: prev.latitude ?? exif.latitude ?? null,
          longitude: prev.longitude ?? exif.longitude ?? null,
        }));
      }
    }
  };

  const handleMediaSelect = (media: Media | Media[]) => {
    if (Array.isArray(media)) return; // Multi-select not supported
    setMediaUrl(media.url);
    setImagePreview(media.url);
    setFormData({ ...formData, image: null }); // Clear file when selecting from library
    setShowMediaPicker(false);
  };

  const handleClearImage = () => {
    setMediaUrl(null);
    setImagePreview(null);
    setFormData({ ...formData, image: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTagToggle = (tagId: number) => {
    setFormData({
      ...formData,
      tagIds: formData.tagIds.includes(tagId)
        ? formData.tagIds.filter((id) => id !== tagId)
        : [...formData.tagIds, tagId],
    });
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch("/api/photos/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      if (res.ok) {
        const newTag = await res.json();
        setLocalTags([...localTags, newTag]);
        setFormData({ ...formData, tagIds: [...formData.tagIds, newTag.id] });
        setNewTagName("");
      }
    } catch {
      console.error("Failed to add tag");
    }
  };

  const handleGenerateStory = async () => {
    // 需要有圖片才能生成
    const imageUrl = imagePreview?.startsWith("data:") ? null : imagePreview;
    if (!imageUrl && !formData.image) {
      setError("請先上傳圖片才能使用 AI 生成故事");
      return;
    }

    setIsGeneratingStory(true);
    setError(null);

    try {
      // 如果是新上傳的圖片，需要先上傳
      let uploadedUrl = imageUrl;
      if (formData.image && !imageUrl) {
        const { publicUrl } = await upload(formData.image, "photos");
        uploadedUrl = publicUrl;
        setImagePreview(publicUrl);
      }

      const res = await fetch("/api/ai/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadedUrl,
          prompt: aiPrompt || undefined,
          language: "zh",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "生成失敗");
      }

      const data = await res.json();

      // 處理 AI 建議的 tags（自動新增不存在的標籤）
      const aiTagIds: number[] = [];
      if (data.tags && Array.isArray(data.tags)) {
        for (const tagName of data.tags) {
          // 檢查標籤是否已存在
          const existingTag = localTags.find(
            (t) => t.name.toLowerCase() === tagName.toLowerCase()
          );
          if (existingTag) {
            aiTagIds.push(existingTag.id);
          } else {
            // 建立新標籤
            try {
              const tagRes = await fetch("/api/photos/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: tagName }),
              });
              if (tagRes.ok) {
                const newTag = await tagRes.json();
                setLocalTags((prev) => [...prev, newTag]);
                aiTagIds.push(newTag.id);
              }
            } catch {
              console.error("Failed to create tag:", tagName);
            }
          }
        }
      }

      // 更新表單（包含所有 AI 回傳的欄位）
      // 使用 functional update 避免閉包過時問題
      const aiTitle = data.title || "";
      const aiSlug = data.slug || "";

      // 生成 slug：優先使用 AI slug，否則從 title 生成
      let generatedSlug = "";
      if (aiSlug) {
        generatedSlug = aiSlug + "-" + Date.now();
      } else if (aiTitle) {
        // 從 title 生成 slug
        generatedSlug = aiTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim() + "-" + Date.now();
      }

      // 處理日期：如果 AI 有回傳日期則使用，否則使用今天
      const aiDate = data.date || new Date().toISOString().split("T")[0];

      setFormData((prev) => {
        // 判斷是否可以更新 slug：
        // 1. 新增模式 (isEditMode = false)
        // 2. 或者是剛 batch upload 的照片 (story 是預設值 "待編輯...")
        const isNewOrDraft = !isEditMode || prev.story === "待編輯..." || prev.story === "";
        const finalSlug = (isNewOrDraft && generatedSlug) ? generatedSlug : prev.slug;

        return {
          ...prev,
          title: aiTitle || prev.title,
          slug: finalSlug,
          story: data.story || prev.story,
          category: data.category || prev.category,
          tagIds: aiTagIds.length > 0 ? aiTagIds : prev.tagIds,
          // 新增欄位：只有 AI 回傳有效值時才覆蓋
          location: data.location || prev.location,
          date: aiDate,
          camera: data.camera || prev.camera,
          lens: data.lens || prev.lens,
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 生成失敗");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let imageSrc = photo?.src;

      // 決定圖片來源：媒體庫 > 新上傳 > 現有圖片
      if (mediaUrl) {
        // 從媒體庫選擇的圖片，直接使用
        imageSrc = mediaUrl;
      } else if (formData.image) {
        // 上傳新圖片
        const { publicUrl } = await upload(formData.image, "photos");
        imageSrc = publicUrl;
      } else if (!isEditMode) {
        throw new Error("Please select an image");
      }

      const payload = {
        slug: formData.slug,
        title: formData.title,
        src: imageSrc,
        category: formData.category,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        date: formData.date,
        camera: formData.camera || null,
        lens: formData.lens || null,
        story: formData.story,
        behindTheScene: formData.behindTheScene || null,
        tagIds: formData.tagIds,
        status: formData.status,
        publishedAt:
          formData.status === "scheduled" && formData.publishedAt
            ? formData.publishedAt
            : null,
        articleId: formData.articleId,
      };

      const url = isEditMode ? `/api/photos/${photo.slug}` : "/api/photos";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save photo");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            {isEditMode ? "Edit Photo" : "Add New Photo"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* AI Auto-fill Section - At the very top */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-stone-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI 智慧填寫
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  上傳圖片後點擊「開始分析」，自動填寫所有欄位
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={isGeneratingStory || (!imagePreview && !formData.image)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isGeneratingStory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    開始分析
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="可選：輸入額外提示（如：這是在東京拍的、使用 Sony A7IV 等）"
              className="w-full px-3 py-2 border border-purple-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Slug
                {isEditMode && formData.story !== "待編輯..." && formData.story !== "" && (
                  <span className="text-xs text-stone-400 ml-2">(編輯模式下無法修改)</span>
                )}
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500"
                required
                disabled={isEditMode && formData.story !== "待編輯..." && formData.story !== ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                <Filter className="w-3 h-3 inline mr-1" />
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                required
              />
            </div>
          </div>

          {/* Map Coordinates */}
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-stone-700 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Map Coordinates
                <span className="text-xs text-stone-400 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.location) return;
                    try {
                      const res = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}&limit=1`,
                        { headers: { "User-Agent": "WeiChieh-Photography-Blog" } }
                      );
                      const data = await res.json();
                      if (data[0]) {
                        setFormData({
                          ...formData,
                          latitude: parseFloat(data[0].lat),
                          longitude: parseFloat(data[0].lon),
                        });
                      }
                    } catch (err) {
                      console.error("Geocode error:", err);
                    }
                  }}
                  className="px-2 py-1 bg-white text-stone-600 rounded border border-stone-300 hover:bg-stone-100 text-xs flex items-center gap-1"
                  title="Search coordinates from location name"
                >
                  <Search className="w-3 h-3" />
                  從地名查詢
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="px-2 py-1 bg-stone-700 text-white rounded hover:bg-stone-800 text-xs flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  開啟地圖選點
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="any"
                placeholder="Latitude (e.g. 25.033)"
                value={formData.latitude ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    latitude: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude (e.g. 121.565)"
                value={formData.longitude ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    longitude: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white"
              />
            </div>
            {formData.latitude && formData.longitude && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Photo will appear on the map page
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                <Camera className="w-3 h-3 inline mr-1" />
                Camera
              </label>
              <input
                type="text"
                value={formData.camera}
                onChange={(e) =>
                  setFormData({ ...formData, camera: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="e.g. Sony A7IV"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Lens
              </label>
              <input
                type="text"
                value={formData.lens}
                onChange={(e) =>
                  setFormData({ ...formData, lens: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="e.g. 85mm f/1.4"
              />
            </div>
          </div>

          {/* Tags - Searchable */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Tag className="w-3 h-3 inline mr-1" />
              Tags
            </label>

            {/* Selected Tags */}
            {formData.tagIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-2 bg-blue-50 rounded-lg">
                {formData.tagIds.map((tagId) => {
                  const tag = localTags.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-full"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className="hover:bg-blue-600 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search/Add Input */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="搜尋或新增標籤..."
                    className="w-full pl-10 pr-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        // 如果有精確匹配的標籤，選中它；否則新增
                        const exactMatch = localTags.find(
                          (t) => t.name.toLowerCase() === newTagName.toLowerCase()
                        );
                        if (exactMatch) {
                          if (!formData.tagIds.includes(exactMatch.id)) {
                            handleTagToggle(exactMatch.id);
                          }
                          setNewTagName("");
                        } else if (newTagName.trim()) {
                          handleAddTag();
                        }
                      }
                    }}
                  />
                </div>
                {newTagName.trim() && !localTags.some(
                  (t) => t.name.toLowerCase() === newTagName.toLowerCase()
                ) && (
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    新增
                  </button>
                )}
              </div>

              {/* Filtered Tags Dropdown */}
              {newTagName && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {localTags
                    .filter((tag) =>
                      tag.name.toLowerCase().includes(newTagName.toLowerCase()) &&
                      !formData.tagIds.includes(tag.id)
                    )
                    .slice(0, 10)
                    .map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          handleTagToggle(tag.id);
                          setNewTagName("");
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-stone-100 flex items-center justify-between"
                      >
                        <span>{tag.name}</span>
                        <Plus className="w-4 h-4 text-stone-400" />
                      </button>
                    ))}
                  {localTags.filter((tag) =>
                    tag.name.toLowerCase().includes(newTagName.toLowerCase()) &&
                    !formData.tagIds.includes(tag.id)
                  ).length === 0 && newTagName.trim() && (
                    <div className="px-3 py-2 text-sm text-stone-500">
                      按 Enter 新增「{newTagName}」
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* All Available Tags (collapsed by default, show when no search) */}
            {!newTagName && localTags.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-700">
                  瀏覽所有標籤 ({localTags.length})
                </summary>
                <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-stone-50 rounded-lg max-h-32 overflow-y-auto">
                  {localTags
                    .filter((tag) => !formData.tagIds.includes(tag.id))
                    .map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className="px-2 py-0.5 text-xs bg-white border border-stone-200 text-stone-600 rounded hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {tag.name}
                      </button>
                    ))}
                </div>
              </details>
            )}
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Image {!isEditMode && "*"}
            </label>

            {imagePreview ? (
              // 有圖片時顯示預覽
              <div className="relative">
                <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-stone-200">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(true)}
                    className="p-1.5 bg-white/90 rounded-full text-stone-600 hover:bg-white shadow-sm"
                    title="更換圖片"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="p-1.5 bg-white/90 rounded-full text-red-600 hover:bg-white shadow-sm"
                    title="移除圖片"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {mediaUrl && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    已從媒體庫選擇
                  </p>
                )}
                {formData.image && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    新上傳: {formData.image.name}
                  </p>
                )}
                {isExtractingExif && (
                  <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    正在讀取 EXIF 資訊...
                  </p>
                )}
              </div>
            ) : (
              // 沒有圖片時顯示選擇按鈕
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="flex-1 flex flex-col items-center gap-2 p-6 border-2 border-dashed border-stone-200 rounded-lg hover:border-stone-400 hover:bg-stone-50 transition-colors"
                >
                  <FolderOpen className="w-8 h-8 text-stone-400" />
                  <span className="text-sm text-stone-600">從媒體庫選擇</span>
                  <span className="text-xs text-stone-400">選擇已上傳的圖片</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center gap-2 p-6 border-2 border-dashed border-stone-200 rounded-lg hover:border-stone-400 hover:bg-stone-50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-stone-400" />
                  <span className="text-sm text-stone-600">上傳新圖片</span>
                  <span className="text-xs text-stone-400">從電腦選擇檔案</span>
                </button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          {/* Media Library Modal */}
          {showMediaPicker && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-medium text-stone-900">從媒體庫選擇</h3>
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(false)}
                    className="p-1 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <MediaLibraryContent
                    selectable
                    multiSelect={false}
                    onSelect={handleMediaSelect}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Story */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Story *
            </label>
            <textarea
              value={formData.story}
              onChange={(e) =>
                setFormData({ ...formData, story: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="描述這張照片背後的故事..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Behind The Scene
            </label>
            <textarea
              value={formData.behindTheScene}
              onChange={(e) =>
                setFormData({ ...formData, behindTheScene: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>

          {/* Link to Article */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              <FileText className="w-3 h-3 inline mr-1" />
              關聯文章（閱讀完整故事）
            </label>
            <select
              value={formData.articleId || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  articleId: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
            >
              <option value="">無（不連結文章）</option>
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-stone-400 mt-1">
              選擇後，照片頁面會顯示「閱讀完整故事」按鈕
            </p>
          </div>

          {/* Publish Settings */}
          <div className="p-4 bg-stone-50 rounded-lg space-y-3">
            <label className="block text-sm font-medium text-stone-700">
              Publish Settings
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={formData.status === "draft"}
                  onChange={() =>
                    setFormData({ ...formData, status: "draft", publishedAt: "" })
                  }
                  className="text-stone-900"
                />
                <EyeOff className="w-4 h-4 text-stone-500" />
                <span className="text-sm text-stone-700">Draft</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="scheduled"
                  checked={formData.status === "scheduled"}
                  onChange={() =>
                    setFormData({ ...formData, status: "scheduled" })
                  }
                  className="text-stone-900"
                />
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-stone-700">Scheduled</span>
              </label>
              {formData.status === "scheduled" && (
                <div className="ml-6">
                  <input
                    type="datetime-local"
                    value={formData.publishedAt}
                    onChange={(e) =>
                      setFormData({ ...formData, publishedAt: e.target.value })
                    }
                    className="px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                    required
                  />
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={formData.status === "published"}
                  onChange={() =>
                    setFormData({ ...formData, status: "published", publishedAt: "" })
                  }
                  className="text-stone-900"
                />
                <Eye className="w-4 h-4 text-green-700" />
                <span className="text-sm text-stone-700">Published</span>
              </label>
            </div>
          </div>

          {/* Progress */}
          {isUploading && (
            <div className="w-full bg-stone-200 rounded-full h-2">
              <div
                className="bg-stone-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors disabled:bg-stone-400"
            >
              {isSubmitting || isUploading ? "Saving..." : isEditMode ? "Save Changes" : "Create Photo"}
            </button>
          </div>
        </form>
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <MapPickerModal
          latitude={formData.latitude}
          longitude={formData.longitude}
          onSelect={(lat, lng) => {
            setFormData({ ...formData, latitude: lat, longitude: lng });
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}
