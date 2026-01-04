"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Upload,
  Filter,
  Loader2,
  X,
  ImageIcon,
} from "lucide-react";
import { MediaCard } from "./MediaCard";
import { MediaUploader } from "./MediaUploader";
import { MediaEditor } from "./MediaEditor";
import { MediaDetailModal } from "./MediaDetailModal";
import type { Media, MediaTag, MediaListResponse } from "../types";

interface MediaLibraryContentProps {
  selectable?: boolean;
  multiSelect?: boolean;
  onSelect?: (media: Media | Media[]) => void;
  selectedIds?: number[];
}

export function MediaLibraryContent({
  selectable = false,
  multiSelect = false,
  onSelect,
  selectedIds = [],
}: MediaLibraryContentProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [tags, setTags] = useState<MediaTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [showUploader, setShowUploader] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [viewingMedia, setViewingMedia] = useState<Media | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Set<number>>(
    new Set(selectedIds)
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMedia = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      try {
        if (reset) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: "24",
        });

        if (search) params.set("search", search);
        if (selectedTag) params.set("tags", selectedTag);

        const res = await fetch(`/api/media?${params}`);
        const data: MediaListResponse = await res.json();

        if (reset) {
          setMedia(data.media);
        } else {
          setMedia((prev) => [...prev, ...data.media]);
        }
        setTotalPages(data.totalPages);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to fetch media:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [search, selectedTag]
  );

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/media/tags");
      const data = await res.json();
      setTags(data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchMedia(1, true);
  }, [fetchMedia]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      fetchMedia(1, true);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, selectedTag, fetchMedia]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          !isLoadingMore &&
          page < totalPages
        ) {
          fetchMedia(page + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [page, totalPages, isLoading, isLoadingMore, fetchMedia]);

  const handleSelect = (item: Media) => {
    if (!selectable) return;

    if (multiSelect) {
      const newSelected = new Set(selectedMedia);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedMedia(newSelected);
      if (onSelect) {
        const selectedItems = media.filter((m) => newSelected.has(m.id));
        onSelect(selectedItems);
      }
    } else {
      setSelectedMedia(new Set([item.id]));
      if (onSelect) {
        onSelect(item);
      }
    }
  };

  const handleDelete = async (item: Media) => {
    if (!confirm(`確定要刪除 "${item.filename}" 嗎？`)) return;

    try {
      const res = await fetch(`/api/media/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== item.id));
      } else {
        const data = await res.json();
        if (res.status === 409) {
          alert(
            `無法刪除：此媒體正在被使用\n照片: ${data.usage.photos.length} 個\n文章: ${data.usage.articles.length} 個`
          );
        } else {
          alert(data.error || "刪除失敗");
        }
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("刪除失敗");
    }
  };

  const handleUploadComplete = () => {
    setShowUploader(false);
    fetchMedia(1, true);
  };

  const handleEditComplete = () => {
    setEditingMedia(null);
    // Refresh to get the new/updated media
    fetchMedia(1, true);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋檔名或描述..."
            className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tag Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="pl-10 pr-8 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 appearance-none bg-white"
          >
            <option value="">所有標籤</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name} ({tag._count?.media || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setShowUploader(true)}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
        >
          <Upload className="w-4 h-4" />
          上傳
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
          <ImageIcon className="w-16 h-16 mb-4" />
          <p className="text-lg">尚無媒體</p>
          <p className="text-sm mt-1">點擊上傳按鈕新增圖片</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {media.map((item) => (
              <MediaCard
                key={item.id}
                media={item}
                isSelected={selectedMedia.has(item.id)}
                selectable={selectable}
                onSelect={handleSelect}
                onView={() => setViewingMedia(item)}
                onEdit={() => setEditingMedia(item)}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="h-10 flex items-center justify-center mt-4">
            {isLoadingMore && (
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            )}
          </div>
        </>
      )}

      {/* Uploader Modal */}
      {showUploader && (
        <MediaUploader
          onClose={() => setShowUploader(false)}
          onComplete={handleUploadComplete}
        />
      )}

      {/* Editor Modal */}
      {editingMedia && (
        <MediaEditor
          media={editingMedia}
          onClose={() => setEditingMedia(null)}
          onSave={handleEditComplete}
        />
      )}

      {/* Detail Modal */}
      {viewingMedia && (
        <MediaDetailModal
          media={viewingMedia}
          onClose={() => setViewingMedia(null)}
          onEdit={() => {
            setViewingMedia(null);
            setEditingMedia(viewingMedia);
          }}
          onUpdate={(updated) => {
            setMedia((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m))
            );
            setViewingMedia(updated);
          }}
        />
      )}
    </div>
  );
}
