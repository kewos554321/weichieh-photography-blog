"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  ArrowUp,
  Edit2,
  Trash2,
} from "lucide-react";
import { MediaCard } from "./MediaCard";
import { MediaUploader } from "./MediaUploader";
import { MediaEditor } from "./MediaEditor";
import { MediaDetailModal } from "./MediaDetailModal";
import { BatchPublishPhotosModal } from "./BatchPublishPhotosModal";
import { FolderBreadcrumb } from "./FolderBreadcrumb";
import { FolderCard } from "./FolderCard";
import { BulkActionBar, BulkAction } from "../common/BulkActionBar";
import type { Media, MediaTag, MediaFolder, MediaListResponse } from "../types";
import { MediaListItem } from "./MediaListItem";

interface FolderWithCount extends MediaFolder {
  _count?: {
    media: number;
    children: number;
  };
}

interface BreadcrumbItem {
  id: number;
  name: string;
}

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
  // URL-based navigation only for main media page (non-selectable mode)
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // State-based folderId for selectable mode (modals)
  const [stateFolderId, setStateFolderId] = useState<number | null>(null);

  // Get folderId from URL query parameter (only in non-selectable mode)
  const urlFolderId = searchParams.get("folderId");
  const currentFolderId = selectable
    ? stateFolderId
    : urlFolderId
      ? parseInt(urlFolderId)
      : null;

  const [media, setMedia] = useState<Media[]>([]);
  const [tags, setTags] = useState<MediaTag[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]); // All folders for dropdown
  const [currentFolders, setCurrentFolders] = useState<FolderWithCount[]>([]); // Folders in current directory
  const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([]);
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

  // Unified selection for folders and media (supports shift-click across both)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set()); // "folder:123" or "media:456"
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const lastSelectedIndexRef = useRef<number | null>(null);

  // Create combined list for shift-select (folders first, then media)
  const combinedItems = useMemo(() => {
    const items: { type: "folder" | "media"; id: number; key: string }[] = [];
    currentFolders.forEach((f) => items.push({ type: "folder", id: f.id, key: `folder:${f.id}` }));
    media.forEach((m) => items.push({ type: "media", id: m.id, key: `media:${m.id}` }));
    return items;
  }, [currentFolders, media]);

  // Selection helpers
  const isItemSelected = useCallback((key: string) => selectedItems.has(key), [selectedItems]);
  const isFolderSelected = useCallback((folderId: number) => selectedItems.has(`folder:${folderId}`), [selectedItems]);
  const isMediaSelected = useCallback((mediaId: number) => selectedItems.has(`media:${mediaId}`), [selectedItems]);

  // Get selected folder IDs and media IDs separately
  const selectedFolderIds = useMemo(() => {
    const ids = new Set<number>();
    selectedItems.forEach((key) => {
      if (key.startsWith("folder:")) {
        ids.add(parseInt(key.split(":")[1]));
      }
    });
    return ids;
  }, [selectedItems]);

  const selectedMediaIds = useMemo(() => {
    const ids = new Set<number>();
    selectedItems.forEach((key) => {
      if (key.startsWith("media:")) {
        ids.add(parseInt(key.split(":")[1]));
      }
    });
    return ids;
  }, [selectedItems]);

  // Get selected media items for BatchPublishPhotosModal
  const bulkSelectedItems = useMemo(() => {
    return media.filter((m) => selectedMediaIds.has(m.id));
  }, [media, selectedMediaIds]);

  // Toggle selection with shift-click support
  const toggleItemSelect = useCallback((key: string, shiftKey: boolean = false) => {
    const currentIndex = combinedItems.findIndex((item) => item.key === key);

    if (shiftKey && lastSelectedIndexRef.current !== null && currentIndex !== -1) {
      // Shift+click: select range
      const start = Math.min(lastSelectedIndexRef.current, currentIndex);
      const end = Math.max(lastSelectedIndexRef.current, currentIndex);

      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        for (let i = start; i <= end; i++) {
          newSet.add(combinedItems[i].key);
        }
        return newSet;
      });
    } else {
      // Normal click: toggle single item
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(key)) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
        return newSet;
      });
    }

    // Update last selected index
    if (currentIndex !== -1) {
      lastSelectedIndexRef.current = currentIndex;
    }
  }, [combinedItems]);

  // Wrapper functions for folder and media selection
  const toggleFolderSelect = useCallback((folderId: number, shiftKey?: boolean) => {
    toggleItemSelect(`folder:${folderId}`, shiftKey || false);
  }, [toggleItemSelect]);

  const toggleMediaSelect = useCallback((mediaId: number, shiftKey?: boolean) => {
    toggleItemSelect(`media:${mediaId}`, shiftKey || false);
  }, [toggleItemSelect]);

  // Combined selection count
  const totalSelectedCount = selectedItems.size;
  const bulkSelectedCount = selectedMediaIds.size;

  // Combined clear selection
  const clearAllSelection = useCallback(() => {
    setSelectedItems(new Set());
    lastSelectedIndexRef.current = null;
  }, []);

  // Combined select all (folders + media)
  const isAllItemsSelected = combinedItems.length > 0 && selectedItems.size === combinedItems.length;

  const toggleSelectAllItems = useCallback(() => {
    if (isAllItemsSelected) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all
      setSelectedItems(new Set(combinedItems.map((item) => item.key)));
    }
    lastSelectedIndexRef.current = null;
  }, [isAllItemsSelected, combinedItems]);

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

        // Use currentFolderId for folder navigation, or selectedFolder for filter
        if (currentFolderId !== null) {
          params.set("folderId", currentFolderId.toString());
        } else if (selectedFolder) {
          params.set("folderId", selectedFolder);
        } else if (!search && !selectedTag) {
          // When at root with no filters, show only root media (no folder)
          params.set("folderId", "none");
        }

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
    [search, selectedTag, selectedFolder, currentFolderId]
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
      const res = await fetch("/api/media/folders?all=true");
      const data = await res.json();
      setFolders(data);
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    }
  }, []);

  const fetchCurrentFolders = useCallback(async () => {
    try {
      const url = currentFolderId
        ? `/api/media/folders?parentId=${currentFolderId}`
        : "/api/media/folders?parentId=null";
      const res = await fetch(url);
      const data = await res.json();
      setCurrentFolders(data);
    } catch (error) {
      console.error("Failed to fetch current folders:", error);
    }
  }, [currentFolderId]);

  const fetchFolderPath = useCallback(async () => {
    if (!currentFolderId) {
      setFolderPath([]);
      return;
    }
    try {
      const res = await fetch(`/api/media/folders/${currentFolderId}`);
      const data = await res.json();
      setFolderPath(data.path || []);
    } catch (error) {
      console.error("Failed to fetch folder path:", error);
    }
  }, [currentFolderId]);

  const navigateToFolder = useCallback((folderId: number | null) => {
    if (selectable) {
      // In selectable mode (modals), use state-based navigation
      setStateFolderId(folderId);
    } else {
      // In main media page, use URL-based navigation for browser back button support
      const params = new URLSearchParams(searchParams.toString());
      if (folderId !== null) {
        params.set("folderId", folderId.toString());
      } else {
        params.delete("folderId");
      }
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    }
    setPage(1);
    setMedia([]);
  }, [selectable, searchParams, router, pathname]);

  useEffect(() => {
    fetchTags();
    fetchFolders();
  }, [fetchTags, fetchFolders]);

  useEffect(() => {
    fetchCurrentFolders();
    fetchFolderPath();
    fetchMedia(1, true);
  }, [fetchCurrentFolders, fetchFolderPath, fetchMedia]);

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
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolderId,
        }),
      });
      if (res.ok) {
        setNewFolderName("");
        setShowFolderForm(false);
        fetchFolders();
        fetchCurrentFolders();
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

  const handleDeleteFolder = async (folderId: number) => {
    const folder = currentFolders.find((f) => f.id === folderId);
    if (!folder) return;

    const hasContent = (folder._count?.media || 0) > 0 || (folder._count?.children || 0) > 0;
    const message = hasContent
      ? `資料夾「${folder.name}」內有檔案或子資料夾，確定要刪除嗎？（檔案會移到根目錄）`
      : `確定要刪除資料夾「${folder.name}」嗎？`;

    if (!confirm(message)) return;

    try {
      const url = hasContent
        ? `/api/media/folders/${folderId}?recursive=true`
        : `/api/media/folders/${folderId}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        fetchFolders();
        fetchCurrentFolders();
      } else {
        const data = await res.json();
        alert(data.error || "刪除資料夾失敗");
      }
    } catch {
      alert("刪除資料夾失敗");
    }
  };

  const handleRenameFolder = async (folder: { id: number; name: string }) => {
    const newName = prompt("輸入新名稱", folder.name);
    if (!newName || newName === folder.name) return;

    try {
      const res = await fetch(`/api/media/folders/${folder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        fetchFolders();
        fetchCurrentFolders();
        fetchFolderPath();
      } else {
        const data = await res.json();
        alert(data.error || "重命名失敗");
      }
    } catch {
      alert("重命名失敗");
    }
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (totalSelectedCount === 0) return;

    const folderCount = selectedFolderIds.size;
    const fileCount = bulkSelectedCount;

    let message = "確定要刪除 ";
    if (folderCount > 0 && fileCount > 0) {
      message += `${folderCount} 個資料夾和 ${fileCount} 個檔案`;
    } else if (folderCount > 0) {
      message += `${folderCount} 個資料夾`;
    } else {
      message += `${fileCount} 個檔案`;
    }
    message += " 嗎？此操作無法復原。";

    if (!confirm(message)) return;
    setIsBulkUpdating(true);
    try {
      // Delete folders first
      const folderPromises = Array.from(selectedFolderIds).map((folderId) =>
        fetch(`/api/media/folders/${folderId}?recursive=true`, { method: "DELETE" })
      );

      // Delete media files
      const mediaPromises = media
        .filter((m) => selectedMediaIds.has(m.id))
        .map((item) =>
          fetch(`/api/media/${item.id}`, { method: "DELETE" })
        );

      const results = await Promise.all([...folderPromises, ...mediaPromises]);
      const failedCount = results.filter((r) => !r.ok).length;
      if (failedCount > 0) {
        alert(`有 ${failedCount} 個項目刪除失敗`);
      }
      fetchMedia(1, true);
      fetchCurrentFolders();
      fetchFolders();
      clearAllSelection();
    } catch {
      alert("批次刪除失敗");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkMoveFolder = async (targetFolderId: string) => {
    if (totalSelectedCount === 0) return;

    const targetId = targetFolderId === "none" ? null : parseInt(targetFolderId);

    // Check if trying to move folder into itself or its children
    if (targetId !== null && selectedFolderIds.has(targetId)) {
      alert("無法將資料夾移動到自己裡面");
      return;
    }

    setIsBulkUpdating(true);
    try {
      // Move selected folders
      const folderPromises = Array.from(selectedFolderIds).map((folderId) =>
        fetch(`/api/media/folders/${folderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId: targetId }),
        })
      );

      // Move media files
      const mediaPromises = media
        .filter((m) => selectedMediaIds.has(m.id))
        .map((item) =>
          fetch(`/api/media/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folderId: targetId }),
          })
        );

      const results = await Promise.all([...folderPromises, ...mediaPromises]);
      const failedCount = results.filter((r) => !r.ok).length;
      if (failedCount > 0) {
        alert(`有 ${failedCount} 個項目移動失敗`);
      }
      fetchMedia(1, true);
      fetchCurrentFolders();
      fetchFolders();
      clearAllSelection();
    } catch {
      alert("批次移動失敗");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Filter out selected folders from move targets (can't move folder into itself)
  const availableMoveTargets = folders.filter(f => !selectedFolderIds.has(f.id));

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
        { value: "none", label: "Root (未分類)" },
        ...availableMoveTargets.map((f) => ({ value: f.id.toString(), label: f.name })),
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
    <div className="space-y-6 relative">
      {/* Bulk Operation Overlay */}
      {isBulkUpdating && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg border border-stone-200">
            <Loader2 className="w-5 h-5 animate-spin text-stone-600" />
            <span className="text-sm font-medium text-stone-700">Processing...</span>
          </div>
        </div>
      )}

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
                  disabled={isBulkUpdating}
                  autoFocus
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={isCreatingFolder || !newFolderName.trim() || isBulkUpdating}
                  className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={isBulkUpdating}
                  className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowFolderForm(true)}
                  disabled={isBulkUpdating}
                  className="p-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="New Folder"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowUploader(true)}
                  disabled={isBulkUpdating}
                  className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className={`flex items-center gap-3 ${isBulkUpdating ? "pointer-events-none opacity-50" : ""}`}>
        <FolderBreadcrumb path={folderPath} onNavigate={navigateToFolder} />
        {currentFolderId && (
          <button
            onClick={() => {
              // Navigate to parent
              const parentIndex = folderPath.length - 2;
              const parentId = parentIndex >= 0 ? folderPath[parentIndex].id : null;
              navigateToFolder(parentId);
            }}
            disabled={isBulkUpdating}
            className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Go up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className={`flex flex-wrap gap-3 items-center ${isBulkUpdating ? "pointer-events-none opacity-50" : ""}`}>
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
          selectedCount={totalSelectedCount}
          onClear={clearAllSelection}
          actions={bulkActions}
          disabled={isBulkUpdating}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      ) : currentFolders.length === 0 && media.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
          <ImageIcon className="w-16 h-16 mb-4" />
          <p className="text-lg">此資料夾是空的</p>
          <p className="text-sm mt-1">點擊上傳按鈕新增圖片，或建立子資料夾</p>
        </div>
      ) : (
        <>
          {/* Folders Section */}
          {currentFolders.length > 0 && viewMode === "grid" && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-stone-500 mb-3">
                Folders ({currentFolders.length})
              </h3>
              <div className={`grid ${GRID_CLASSES[gridSize]} gap-4`}>
                {currentFolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    isSelected={isFolderSelected(folder.id)}
                    showCheckbox={!selectable}
                    onOpen={navigateToFolder}
                    onSelect={toggleFolderSelect}
                    onRename={handleRenameFolder}
                    onDelete={handleDeleteFolder}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Files Section - Grid View */}
          {media.length > 0 && viewMode === "grid" && (
            <div>
              {currentFolders.length > 0 && (
                <h3 className="text-sm font-medium text-stone-500 mb-3">
                  Files ({media.length})
                </h3>
              )}
              <div className={`grid ${GRID_CLASSES[gridSize]} gap-4`}>
                {media.map((item) => (
                  <MediaCard
                    key={item.id}
                    media={item}
                    isSelected={selectable ? selectedMedia.has(item.id) : isMediaSelected(item.id)}
                    selectable={selectable}
                    showCheckbox={!selectable}
                    onSelect={selectable ? handleSelect : (m, shiftKey) => toggleMediaSelect(m.id, shiftKey)}
                    onEdit={() => setViewingMedia(item)}
                    onEditImage={() => setEditingMedia(item)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* List View - Folders & Files */}
          {viewMode === "list" && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      {!selectable && (
                        <th className="px-4 py-3 text-left w-10">
                          <input
                            type="checkbox"
                            checked={isAllItemsSelected}
                            onChange={toggleSelectAllItems}
                            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                          />
                        </th>
                      )}
                      {!compactMode && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider w-20">
                          Preview
                        </th>
                      )}
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                        onClick={() => handleSort("filename")}
                      >
                        <div className="flex items-center gap-1">
                          Name
                          <SortIcon field="filename" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700 w-24"
                        onClick={() => handleSort("size")}
                      >
                        <div className="flex items-center gap-1">
                          Size
                          <SortIcon field="size" />
                        </div>
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider w-28">
                        Dimensions
                      </th>
                      <th
                        className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700 w-28"
                        onClick={() => handleSort("folder")}
                      >
                        <div className="flex items-center gap-1">
                          Folder
                          <SortIcon field="folder" />
                        </div>
                      </th>
                      <th
                        className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700 w-28"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          <SortIcon field="createdAt" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {/* Folder Rows */}
                    {currentFolders.map((folder) => (
                      <tr
                        key={`folder-${folder.id}`}
                        className={`hover:bg-stone-50 cursor-pointer ${isFolderSelected(folder.id) ? "bg-stone-50" : ""}`}
                        onClick={() => navigateToFolder(folder.id)}
                      >
                        {!selectable && (
                          <td className="px-4 py-3 w-10">
                            <input
                              type="checkbox"
                              checked={isFolderSelected(folder.id)}
                              onChange={() => toggleFolderSelect(folder.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                            />
                          </td>
                        )}
                        {!compactMode && (
                          <td className="px-4 py-3 w-20">
                            <div className="w-16 h-12 flex items-center justify-center">
                              <FolderOpen className="w-10 h-8 text-amber-400" />
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className="font-medium text-stone-900 flex items-center gap-2">
                            {compactMode && <FolderOpen className="w-4 h-4 text-amber-400" />}
                            {folder.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-500 w-24">
                          —
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-stone-500 w-28">
                          {(folder._count?.children || 0) > 0 && `${folder._count?.children} folders`}
                          {(folder._count?.children || 0) > 0 && (folder._count?.media || 0) > 0 && ", "}
                          {(folder._count?.media || 0) > 0 && `${folder._count?.media} files`}
                          {(folder._count?.children || 0) === 0 && (folder._count?.media || 0) === 0 && "Empty"}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-stone-400 w-28">
                          —
                        </td>
                        <td className="hidden xl:table-cell px-4 py-3 text-sm text-stone-500 w-28">
                          —
                        </td>
                        <td className="px-4 py-3 text-right w-32">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameFolder(folder);
                              }}
                              className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded"
                              title="Rename"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id);
                              }}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* File Rows */}
                    {sortedMedia.map((item) => (
                      <MediaListItem
                        key={item.id}
                        media={item}
                        isSelected={selectable ? selectedMedia.has(item.id) : isMediaSelected(item.id)}
                        selectable={selectable}
                        showCheckbox={!selectable}
                        compactMode={compactMode}
                        onSelect={selectable ? handleSelect : (m, shiftKey) => toggleMediaSelect(m.id, shiftKey)}
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
            clearAllSelection();
            fetchMedia(1, true);
          }}
        />
      )}
    </div>
  );
}
