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
  FolderPlus,
  LayoutGrid,
  List,
  ChevronUp,
  ChevronDown,
  Camera,
} from "lucide-react";
import { MediaCard } from "./MediaCard";
import { MediaUploader } from "./MediaUploader";
import { MediaEditor } from "./MediaEditor";
import { MediaDetailModal } from "./MediaDetailModal";
import { BatchPublishPhotosModal } from "./BatchPublishPhotosModal";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionBar, BulkAction } from "../common/BulkActionBar";
import type { Media, MediaTag, MediaFolder, MediaListResponse } from "../types";
import { MediaListItem } from "./MediaListItem";

type ViewMode = "grid" | "list";
type GridSize = "small" | "medium" | "large";
type SortField = "filename" | "size" | "createdAt" | "folder";
type SortDirection = "asc" | "desc";

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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [gridSize, setGridSize] = useState<GridSize>("medium");
  const [compactMode, setCompactMode] = useState(false);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showUploader, setShowUploader] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [viewingMedia, setViewingMedia] = useState<Media | null>(null);
  const [showBatchPublish, setShowBatchPublish] = useState(false);
  // For external picker selection
  const [selectedMedia, setSelectedMedia] = useState<Set<number>>(
    new Set(selectedIds)
  );

  // Bulk selection for batch operations (when not in selectable mode)
  const {
    selectedCount: bulkSelectedCount,
    selectedItems: bulkSelectedItems,
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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      const res = await fetch("/api/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      if (res.ok) {
        setNewFolderName("");
        setShowFolderForm(false);
        fetchFolders();
      } else {
        const data = await res.json();
        alert(data.error || "建立資料夾失敗");
      }
    } catch {
      alert("建立資料夾失敗");
    } finally {
      setIsCreatingFolder(false);
    }
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
      key: "publish",
      label: "Publish as Photos",
      icon: <Camera className="w-4 h-4" />,
      onAction: () => setShowBatchPublish(true),
    },
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

  // Sort media
  const sortedMedia = [...media].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "filename":
        comparison = a.filename.localeCompare(b.filename);
        break;
      case "size":
        comparison = a.size - b.size;
        break;
      case "createdAt":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "folder":
        const aFolder = a.folder?.name || "";
        const bFolder = b.folder?.name || "";
        comparison = aFolder.localeCompare(bFolder);
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header - only show when not in picker mode */}
      {!selectable && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-stone-900">Media</h1>
          <div className="flex items-center gap-2">
            {showFolderForm ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 w-40"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  autoFocus
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
                  title="Create"
                >
                  {isCreatingFolder ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FolderPlus className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowFolderForm(false);
                    setNewFolderName("");
                  }}
                  className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowFolderForm(true)}
                  className="p-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                  title="New Folder"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowUploader(true)}
                  className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
                  title="Upload"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media..."
            className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 w-64 bg-white"
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
            className="pl-10 pr-8 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 appearance-none bg-white"
          >
            <option value="">All Folders</option>
            <option value="none">Uncategorized</option>
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
            className="pl-10 pr-8 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 appearance-none bg-white"
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name} ({tag._count?.media || 0})
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 transition-colors ${
              viewMode === "grid"
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-500 hover:text-stone-700"
            }`}
            title="Grid view"
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
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
          {/* Grid Size Toggle (only visible in grid mode) */}
          {viewMode === "grid" && (
            <>
              <div className="w-px h-6 bg-stone-200" />
              {(["small", "medium", "large"] as GridSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  className={`px-2.5 py-2 text-xs font-medium transition-colors ${
                    gridSize === size
                      ? "bg-stone-900 text-white"
                      : "bg-white text-stone-500 hover:text-stone-700"
                  }`}
                  title={size === "small" ? "Small" : size === "medium" ? "Medium" : "Large"}
                >
                  {size === "small" ? "S" : size === "medium" ? "M" : "L"}
                </button>
              ))}
            </>
          )}
          {/* Compact Toggle (only visible in list mode) */}
          {viewMode === "list" && (
            <>
              <div className="w-px h-6 bg-stone-200" />
              <button
                onClick={() => setCompactMode(!compactMode)}
                className={`px-2.5 py-2 text-xs font-medium transition-colors ${
                  compactMode
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-500 hover:text-stone-700"
                }`}
                title="Compact mode (hide thumbnails)"
              >
                Compact
              </button>
            </>
          )}
        </div>

        {/* Upload Button - only show in picker mode */}
        {selectable && (
          <button
            onClick={() => setShowUploader(true)}
            className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
            title="Upload"
          >
            <Upload className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bulk Action Bar (only show when not in picker/selectable mode) */}
      {!selectable && (
        <BulkActionBar
          selectedCount={bulkSelectedCount}
          onClear={bulkClearSelection}
          actions={bulkActions}
          disabled={isBulkUpdating}
        />
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
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      {!selectable && (
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={bulkIsAllSelected}
                            onChange={bulkToggleSelectAll}
                            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                          />
                        </th>
                      )}
                      {!compactMode && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                          Thumbnail
                        </th>
                      )}
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                        onClick={() => handleSort("filename")}
                      >
                        <div className="flex items-center gap-1">
                          Filename
                          <SortIcon field="filename" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                        onClick={() => handleSort("size")}
                      >
                        <div className="flex items-center gap-1">
                          Size
                          <SortIcon field="size" />
                        </div>
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        Dimensions
                      </th>
                      <th
                        className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                        onClick={() => handleSort("folder")}
                      >
                        <div className="flex items-center gap-1">
                          Folder
                          <SortIcon field="folder" />
                        </div>
                      </th>
                      <th
                        className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          <SortIcon field="createdAt" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {sortedMedia.map((item) => (
                      <MediaListItem
                        key={item.id}
                        media={item}
                        isSelected={selectable ? selectedMedia.has(item.id) : bulkIsSelected(item.id)}
                        selectable={selectable}
                        showCheckbox={!selectable}
                        compactMode={compactMode}
                        onSelect={selectable ? handleSelect : (m) => bulkToggleSelect(m.id)}
                        onEdit={() => setViewingMedia(item)}
                        onEditImage={() => setEditingMedia(item)}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
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

      {/* Batch Publish Modal */}
      {showBatchPublish && bulkSelectedItems.length > 0 && (
        <BatchPublishPhotosModal
          mediaItems={bulkSelectedItems}
          onClose={() => setShowBatchPublish(false)}
          onComplete={() => {
            setShowBatchPublish(false);
            bulkClearSelection();
            fetchMedia(1, true);
          }}
        />
      )}
    </div>
  );
}
