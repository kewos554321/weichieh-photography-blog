"use client";

import Image from "next/image";
import { useState } from "react";
import { useUpload } from "@/hooks/useUpload";
import MarkdownContent from "@/components/MarkdownContent";
import type { Post, PostTag, Category } from "../types";
import {
  Plus,
  Search,
  X,
  Tag,
  FileText,
  Filter,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Wand2,
  Images,
} from "lucide-react";
import { ReferenceImagePicker } from "../media/ReferenceImagePicker";

interface PostModalProps {
  post: Post | null;
  tags: PostTag[];
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export function PostModal({ post, tags, categories, onClose, onSuccess }: PostModalProps) {
  const { upload, isUploading, progress } = useUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    post?.cover || null
  );
  const [newTagName, setNewTagName] = useState("");
  const [localTags, setLocalTags] = useState<PostTag[]>(tags);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const contentTextareaRef = { current: null as HTMLTextAreaElement | null };

  // 合併資料庫分類和預設分類
  const allCategories = categories.length > 0
    ? categories.map((c) => c.name)
    : ["技巧分享", "旅行日記", "攝影思考"];

  const [formData, setFormData] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    category: post?.category || allCategories[0],
    excerpt: post?.excerpt || "",
    content: post?.content || "",
    cover: null as File | null,
    status: post?.status || ("draft" as "draft" | "scheduled" | "published"),
    publishedAt: post?.publishedAt
      ? post.publishedAt.slice(0, 16)
      : "",
    tagIds: post?.tags?.map((t) => t.id) || ([] as number[]),
  });

  const isEditMode = !!post;

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormData({ ...formData, title, slug: isEditMode ? formData.slug : slug });
  };

  const handleGenerateSlug = async () => {
    if (!formData.title.trim()) return;

    setIsGeneratingSlug(true);
    try {
      const response = await fetch("/api/ai/generate-slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          type: "post",
          excludeSlug: isEditMode ? post?.slug : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate slug");

      const data = await response.json();
      if (data.slug) {
        setFormData((prev) => ({ ...prev, slug: data.slug }));
      }
    } catch (err) {
      console.error("Generate slug error:", err);
    } finally {
      setIsGeneratingSlug(false);
    }
  };

  const handleCoverChange = (file: File | null) => {
    setFormData({ ...formData, cover: file });
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCoverPreview(e.target?.result as string);
      reader.readAsDataURL(file);
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
      const res = await fetch("/api/posts/tags", {
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

  // AI 生成文章
  const handleGeneratePost = async () => {
    const imageUrl = coverPreview?.startsWith("data:") ? null : coverPreview;
    const hasValidCover = imageUrl || formData.cover;
    const hasReferenceImages = referenceImages.length > 0;
    const hasPrompt = aiPrompt.trim().length > 0;

    // 需要至少有封面、參考圖片或提示詞其中之一
    if (!hasValidCover && !hasReferenceImages && !hasPrompt) {
      setError("請上傳封面圖片、參考組圖或輸入提示詞才能使用 AI 生成");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 如果是新上傳的圖片，需要先上傳
      let uploadedUrl = imageUrl;
      if (formData.cover && !imageUrl) {
        const { publicUrl } = await upload(formData.cover, "articles");
        uploadedUrl = publicUrl;
        setCoverPreview(publicUrl);
      }

      const res = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadedUrl || undefined,
          referenceImageUrls: hasReferenceImages ? referenceImages : undefined,
          prompt: aiPrompt || undefined,
          language: "zh",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "生成失敗");
      }

      const data = await res.json();

      // 處理 AI 建議的 tags
      const aiTagIds: number[] = [];
      if (data.tags && Array.isArray(data.tags)) {
        for (const tagName of data.tags) {
          const existingTag = localTags.find(
            (t) => t.name.toLowerCase() === tagName.toLowerCase()
          );
          if (existingTag) {
            aiTagIds.push(existingTag.id);
          } else {
            try {
              const tagRes = await fetch("/api/posts/tags", {
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

      // 生成 slug
      const aiTitle = data.title || "";
      const aiSlug = data.slug || "";
      let generatedSlug = "";
      if (aiSlug) {
        generatedSlug = aiSlug + "-" + Date.now();
      } else if (aiTitle) {
        generatedSlug = aiTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim() + "-" + Date.now();
      }

      setFormData((prev) => {
        const isNewOrDraft = !isEditMode || prev.content === "" || prev.excerpt === "";
        const finalSlug = (isNewOrDraft && generatedSlug) ? generatedSlug : prev.slug;

        return {
          ...prev,
          title: aiTitle || prev.title,
          slug: finalSlug,
          excerpt: data.excerpt || prev.excerpt,
          content: data.content || prev.content,
          category: data.category || prev.category,
          tagIds: aiTagIds.length > 0 ? aiTagIds : prev.tagIds,
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 生成失敗");
    } finally {
      setIsGenerating(false);
    }
  };

  // 插入圖片到文章內容
  const handleInsertImage = async (file: File) => {
    if (!file) return;

    setIsUploadingImage(true);
    setError(null);

    try {
      const { publicUrl } = await upload(file, "articles");

      // 生成圖片的 alt 文字（使用檔名）
      const altText = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      // 插入 Markdown 圖片語法
      const imageMarkdown = `\n\n![${altText}](${publicUrl})\n\n`;

      // 在游標位置插入，或者在末尾追加
      const textarea = contentTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          formData.content.substring(0, start) +
          imageMarkdown +
          formData.content.substring(end);
        setFormData({ ...formData, content: newContent });

        // 設定游標位置到圖片後面
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
        }, 0);
      } else {
        // 如果沒有 textarea ref，直接追加到末尾
        setFormData({ ...formData, content: formData.content + imageMarkdown });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "圖片上傳失敗");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 插入 Markdown 格式
  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const newContent =
      formData.content.substring(0, start) +
      before + selectedText + after +
      formData.content.substring(end);

    setFormData({ ...formData, content: newContent });

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + selectedText.length;
      } else {
        textarea.selectionStart = textarea.selectionEnd = start + before.length;
      }
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let coverUrl = post?.cover;

      // 上傳新封面
      if (formData.cover) {
        const { publicUrl } = await upload(formData.cover, "articles");
        coverUrl = publicUrl;
      } else if (!isEditMode) {
        throw new Error("Please select a cover image");
      }

      const payload = {
        slug: formData.slug,
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        cover: coverUrl,
        category: formData.category,
        status: formData.status,
        publishedAt:
          formData.status === "scheduled" && formData.publishedAt
            ? formData.publishedAt
            : null,
        tagIds: formData.tagIds,
      };

      const url = isEditMode ? `/api/posts/${post.slug}` : "/api/posts";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save post");
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
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isEditMode ? "Edit Post" : "Add New Post"}
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

          {/* AI Auto-fill Section */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-stone-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI 智慧生成
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  上傳封面圖或參考組圖後，自動生成標題、摘要、分類、Tags 和完整文章
                </p>
              </div>
              <button
                type="button"
                onClick={handleGeneratePost}
                disabled={isGenerating || (!coverPreview && !formData.cover && referenceImages.length === 0 && !aiPrompt.trim())}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    開始生成
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="可選：輸入額外提示（如：這是一篇關於黃金時刻攝影技巧的文章、偏向教學風格等）"
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
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-md bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500"
                  required
                />
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  disabled={isGeneratingSlug || !formData.title.trim()}
                  className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="AI 產生 Slug"
                >
                  {isGeneratingSlug ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

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

            {/* All Available Tags */}
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

          {/* Cover */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Cover Image {!isEditMode && "*"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleCoverChange(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
              required={!isEditMode}
            />
            {coverPreview && (
              <div className="mt-2 relative aspect-video w-full max-w-sm overflow-hidden rounded-md">
                <Image
                  src={coverPreview}
                  alt="Cover Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Reference Images for AI */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
              <Images className="w-4 h-4" />
              參考組圖（AI 生成用）
            </label>
            <p className="text-xs text-stone-500 mb-2">
              選擇最多 5 張照片作為 AI 生成文章的參考素材
            </p>
            <ReferenceImagePicker
              value={referenceImages}
              onChange={(urls) => setReferenceImages(urls)}
              maxCount={5}
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Excerpt *
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) =>
                setFormData({ ...formData, excerpt: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="Brief description..."
              required
            />
          </div>

          {/* Content with Markdown Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-stone-700">
                Content (Markdown) *
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full transition-colors ${
                  showPreview
                    ? "bg-blue-500 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <Eye className="w-3 h-3" />
                {showPreview ? "隱藏預覽" : "顯示預覽"}
              </button>
            </div>

            {/* Editor Toolbar */}
            <div className="flex items-center gap-1 mb-2 p-2 bg-stone-50 rounded-t-md border border-b-0 border-stone-300">
              <button
                type="button"
                onClick={() => insertMarkdown("## ", "")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs font-bold"
                title="標題"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("### ", "")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs font-bold"
                title="小標題"
              >
                H3
              </button>
              <div className="w-px h-4 bg-stone-300 mx-1" />
              <button
                type="button"
                onClick={() => insertMarkdown("**", "**")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs font-bold"
                title="粗體"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("*", "*")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs italic"
                title="斜體"
              >
                I
              </button>
              <div className="w-px h-4 bg-stone-300 mx-1" />
              <button
                type="button"
                onClick={() => insertMarkdown("- ", "")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs"
                title="列表"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("> ", "")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs"
                title="引用"
              >
                &ldquo; Quote
              </button>
              <div className="w-px h-4 bg-stone-300 mx-1" />
              <button
                type="button"
                onClick={() => insertMarkdown("[", "](url)")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs"
                title="連結"
              >
                Link
              </button>
              <div className="w-px h-4 bg-stone-300 mx-1" />
              {/* Image Upload */}
              <label
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                  isUploadingImage
                    ? "bg-stone-300 text-stone-500"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                title="插入圖片"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    上傳中...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3 h-3" />
                    插入圖片
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleInsertImage(file);
                    e.target.value = "";
                  }}
                  className="hidden"
                  disabled={isUploadingImage}
                />
              </label>
            </div>

            <div className={`grid gap-4 ${showPreview ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {/* Editor */}
              <div>
                <textarea
                  ref={(el) => { contentTextareaRef.current = el; }}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={showPreview ? 20 : 10}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md rounded-t-none focus:outline-none focus:ring-2 focus:ring-stone-500 font-mono text-sm resize-none"
                  placeholder="## 標題&#10;&#10;在這裡撰寫文章內容...&#10;&#10;### 小標題&#10;&#10;- 列表項目 1&#10;- 列表項目 2&#10;&#10;> 引用文字"
                  required
                />
              </div>
              {/* Preview */}
              {showPreview && (
                <div className="border border-stone-200 rounded-md p-4 bg-white overflow-y-auto max-h-[480px]">
                  <div className="prose prose-stone prose-sm max-w-none markdown-preview">
                    {formData.content ? (
                      <MarkdownContent content={formData.content} />
                    ) : (
                      <p className="text-stone-400 italic">預覽會顯示在這裡...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
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
                  name="post-status"
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
                  name="post-status"
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
                  name="post-status"
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
              {isSubmitting || isUploading ? "Saving..." : isEditMode ? "Save Changes" : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
