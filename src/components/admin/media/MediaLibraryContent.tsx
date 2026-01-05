"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Upload,
  Filter,
  Loader2,
  X,
  ImageIcon,
  FolderOpen,
  LayoutGrid,
  List,
} from "lucide-react";
import { MediaCard } from "./MediaCard";
import { MediaUploader } from "./MediaUploader";
import { MediaEditor } from "./MediaEditor";
import { MediaDetailModal } from "./MediaDetailModal";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionBar, BulkAction } from "../common/BulkActionBar";
import type { Media, MediaTag, MediaFolder, MediaListResponse } from "../types";
import { MediaListItem } from "./MediaListItem";

type ViewMode = "grid" | "list";
type GridSize = "small" | "medium" | "large";

const GRID_CLASSES: Record<GridSize, string> = {
  small: "grid-cols-3 md:grid-cols-5 lg:grid-cols-8",
  medium: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
  large: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
};

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
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [gridSize, setGridSize] = useState<GridSize>("medium");
  const [showUploader, setShowUploader] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [viewingMedia, setViewingMedia] = useState<Media | null>(null);
  // For external picker selection
  const [selectedMedia, setSelectedMedia] = useState<Set<number>>(
    new Set(selectedIds)
  );

  // Bulk selection for batch operations (when not in selectable mode)
  const {
    selectedCount: bulkSelectedCount,
    isAllSelected: bulkIsAllSelected,
    isBulkUpdating,
    toggleSelect: bulkToggleSelect,
    toggleSelectAll: bulkToggleSelectAll,
    clearSelection: bulkClearSelection,
    setIsBulkUpdating,
    isSelected: bulkIsSelected,
  } = useBulkSelection({
    items: media,
    getItemId: (m) => m.id,
  });

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
        if (selectedFolder) params.set("folderId", selectedFolder);

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
    [search, selectedTag, selectedFolder]
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

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/media/folders");
      const data = await res.json();
      setFolders(data);
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    }
  }, []);

  useEffect(() => {
    fetchTags();
    fetchFolders();
  }, [fetchTags, fetchFolders]);

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
  }, [search, selectedTag, selectedFolder, fetchMedia]);

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

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (bulkSelectedCount === 0) return;
    if (!confirm(`確定要刪除 ${bulkSelectedCount} 個媒體檔案嗎？此操作無法復原。`)) return;
    setIsBulkUpdating(true);
    try {
      const promises = media
        .filter((m) => bulkIsSelected(m.id))
        .map((item) =>
          fetch(`/api/media/${item.id}`, { method: "DELETE" })
        );
      const results = await Promise.all(promises);
      const failedCount = results.filter((r) => !r.ok).length;
      if (failedCount > 0) {
        alert(`有 ${failedCount} 個檔案刪除失敗（可能正在被使用）`);
      }
      fetchMedia(1, true);
      bulkClearSelection();
    } catch {
      alert("批次刪除失敗");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkMoveFolder = async (folderId: string) => {
    if (bulkSelectedCount === 0) return;
    setIsBulkUpdating(true);
    try {
      const promises = media
        .filter((m) => bulkIsSelected(m.id))
        .map((item) =>
          fetch(`/api/media/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folderId: folderId === "none" ? null : parseInt(folderId) }),
          })
        );
      await Promise.all(promises);
      fetchMedia(1, true);
      bulkClearSelection();
    } catch {
      alert("批次移動失敗");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const bulkActions: BulkAction[] = [
    {
      key: "folder",
      label: "Move to...",
      options: [
        { value: "none", label: "未分類" },
        ...folders.map((f) => ({ value: f.id.toString(), label: f.name })),
      ],
      onAction: (value) => value && handleBulkMoveFolder(value),
    },
    {
      key: "delete",
      label: "Delete",
      variant: "danger",
      onAction: handleBulkDelete,
    },
  ];

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

        {/* Folder Filter */}
        <div className="relative">
          <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="pl-10 pr-8 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 appearance-none bg-white"
          >
            <option value="">所有資料夾</option>
            <option value="none">未分類</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id.toString()}>
                {folder.name} ({folder._count?.media || 0})
              </option>
            ))}
          </select>
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

        {/* View Mode Toggle */}
        <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 transition-colors ${
              viewMode === "grid"
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-500 hover:text-stone-700"
            }`}
            title="網格視圖"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors ${
              viewMode === "list"
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-500 hover:text-stone-700"
            }`}
            title="列表視圖"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Grid Size Toggle (only visible in grid mode) */}
        {viewMode === "grid" && (
          <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
            {(["small", "medium", "large"] as GridSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  gridSize === size
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-500 hover:text-stone-700"
                }`}
                title={size === "small" ? "小" : size === "medium" ? "中" : "大"}
              >
                {size === "small" ? "S" : size === "medium" ? "M" : "L"}
              </button>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={() => setShowUploader(true)}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
        >
          <Upload className="w-4 h-4" />
          上傳
        </button>
      </div>

      {/* Bulk Action Bar (only show when not in picker/selectable mode) */}
      {!selectable && (
        <div className="mb-4">
          <BulkActionBar
            selectedCount={bulkSelectedCount}
            onClear={bulkClearSelection}
            actions={bulkActions}
            disabled={isBulkUpdating}
          />
        </div>
      )}

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
          {viewMode === "grid" ? (
            <div className={`grid ${GRID_CLASSES[gridSize]} gap-4`}>
              {media.map((item) => (
                <MediaCard
                  key={item.id}
                  media={item}
                  isSelected={selectable ? selectedMedia.has(item.id) : bulkIsSelected(item.id)}
                  selectable={selectable}
                  showCheckbox={!selectable}
                  onSelect={selectable ? handleSelect : (m) => bulkToggleSelect(m.id)}
                  onEdit={() => setViewingMedia(item)}
                  onEditImage={() => setEditingMedia(item)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* List Header */}
              <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-stone-400 border-b border-stone-200">
                {!selectable && (
                  <div className="w-6 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={bulkIsAllSelected}
                      onChange={bulkToggleSelectAll}
                      className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                    />
                  </div>
                )}
                <div className="w-12 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">檔名</div>
                <div className="w-20 text-right flex-shrink-0">大小</div>
                <div className="hidden md:block w-28 text-right flex-shrink-0">尺寸</div>
                <div className="hidden lg:block w-20 flex-shrink-0">資料夾</div>
                <div className="hidden xl:block w-24 flex-shrink-0">日期</div>
                <div className="w-24 text-right flex-shrink-0">操作</div>
              </div>
              {media.map((item) => (
                <MediaListItem
                  key={item.id}
                  media={item}
                  isSelected={selectable ? selectedMedia.has(item.id) : bulkIsSelected(item.id)}
                  selectable={selectable}
                  showCheckbox={!selectable}
                  onSelect={selectable ? handleSelect : (m) => bulkToggleSelect(m.id)}
                  onEdit={() => setViewingMedia(item)}
                  onEditImage={() => setEditingMedia(item)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

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
