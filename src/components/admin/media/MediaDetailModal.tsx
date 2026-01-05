"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Edit2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Tag,
  FolderOpen,
} from "lucide-react";
import type { Media, MediaTag, MediaFolder, MediaWithUsage } from "../types";

interface MediaDetailModalProps {
  media: Media;
  onClose: () => void;
  onEdit: () => void;
  onUpdate: (media: Media) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MediaDetailModal({
  media,
  onClose,
  onEdit,
  onUpdate,
}: MediaDetailModalProps) {
  const [details, setDetails] = useState<MediaWithUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alt, setAlt] = useState(media.alt || "");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [allTags, setAllTags] = useState<MediaTag[]>([]);
  const [allFolders, setAllFolders] = useState<MediaFolder[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    media.tags.map((t) => t.id)
  );
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(
    media.folderId
  );

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [mediaRes, tagsRes, foldersRes] = await Promise.all([
          fetch(`/api/media/${media.id}`),
          fetch("/api/media/tags"),
          fetch("/api/media/folders"),
        ]);
        const mediaData = await mediaRes.json();
        const tagsData = await tagsRes.json();
        const foldersData = await foldersRes.json();
        setDetails(mediaData);
        setAllTags(tagsData);
        setAllFolders(foldersData);
        setAlt(mediaData.alt || "");
        setSelectedTagIds(mediaData.tags.map((t: MediaTag) => t.id));
        setSelectedFolderId(mediaData.folderId);
      } catch (error) {
        console.error("Failed to fetch media details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [media.id]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(media.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy URL");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/media/${media.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alt,
          tagIds: selectedTagIds,
          folderId: selectedFolderId,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex">
        {/* Image Preview */}
        <div className="flex-1 bg-stone-900 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-h-[70vh]">
            <Image
              src={media.url}
              alt={media.alt || media.filename}
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Details Panel */}
        <div className="w-80 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-medium text-stone-900 truncate">
              {media.filename}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
              </div>
            ) : (
              <>
                {/* File Info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-stone-700">
                    檔案資訊
                  </h3>
                  <div className="text-sm text-stone-500 space-y-1">
                    <p>大小: {formatFileSize(media.size)}</p>
                    {media.width && media.height && (
                      <p>
                        尺寸: {media.width} × {media.height}
                      </p>
                    )}
                    <p>類型: {media.mimeType}</p>
                    <p>上傳: {formatDate(media.createdAt)}</p>
                  </div>
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-stone-700">URL</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={media.url}
                      readOnly
                      className="flex-1 px-2 py-1 text-xs bg-stone-50 border border-stone-200 rounded truncate"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className="p-1 text-stone-500 hover:text-stone-700"
                      title="複製"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-stone-500 hover:text-stone-700"
                      title="開啟"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Alt Text */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-stone-700">
                    替代文字 (Alt)
                  </h3>
                  <textarea
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    placeholder="描述圖片內容..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-stone-500"
                  />
                </div>

                {/* Folder */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-stone-700 flex items-center gap-1">
                    <FolderOpen className="w-4 h-4" />
                    資料夾
                  </h3>
                  <select
                    value={selectedFolderId?.toString() || ""}
                    onChange={(e) => setSelectedFolderId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                  >
                    <option value="">未分類</option>
                    {allFolders.map((folder) => (
                      <option key={folder.id} value={folder.id.toString()}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-stone-700 flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    標籤
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          selectedTagIds.includes(tag.id)
                            ? "bg-stone-900 text-white"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                    {allTags.length === 0 && (
                      <p className="text-xs text-stone-400">尚無標籤</p>
                    )}
                  </div>
                </div>

                {/* Usage */}
                {details && (details.usage.photos.length > 0 || details.usage.articles.length > 0) && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-stone-700">
                      使用中
                    </h3>
                    <div className="text-sm text-stone-500 space-y-1">
                      {details.usage.photos.length > 0 && (
                        <p>
                          照片: {details.usage.photos.map((p) => p.title).join(", ")}
                        </p>
                      )}
                      {details.usage.articles.length > 0 && (
                        <p>
                          文章: {details.usage.articles.map((a) => a.title).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-stone-50">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-stone-600 hover:text-stone-800"
            >
              <Edit2 className="w-4 h-4" />
              編輯圖片
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 px-4 py-1.5 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  儲存中...
                </>
              ) : (
                "儲存"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
