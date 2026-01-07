"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Edit2, Trash2, Images, Eye, EyeOff, ChevronUp, ChevronDown, Tag, FolderOpen } from "lucide-react";
import { AlbumModal } from "./AlbumModal";
import { AlbumCard } from "./AlbumCard";
import { AlbumFilters } from "./AlbumFilters";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionBar, BulkAction } from "../common/BulkActionBar";
import { ViewMode, GridSize, GRID_CLASSES } from "../shared/ViewModeToggle";

interface Photo {
  id: number;
  slug: string;
  src: string;
  title: string;
}

interface AlbumCategory {
  id: number;
  name: string;
  slug: string;
  _count?: { albums: number };
}

interface AlbumTag {
  id: number;
  name: string;
  _count?: { albums: number };
}

interface Album {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  visibility?: string;
  photoCount: number;
  previewPhotos: Photo[];
  category?: AlbumCategory | null;
  categoryId?: number | null;
  tags?: AlbumTag[];
  createdAt?: string;
}

type SortField = "name" | "photoCount" | "createdAt" | "isPublic" | "category";
type SortDirection = "asc" | "desc";

export function AlbumListContent() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [categories, setCategories] = useState<AlbumCategory[]>([]);
  const [tags, setTags] = useState<AlbumTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [gridSize, setGridSize] = useState<GridSize>("medium");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    selectedCount,
    isAllSelected,
    isBulkUpdating,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    setIsBulkUpdating,
    isSelected,
  } = useBulkSelection({
    items: albums,
    getItemId: (album) => album.id,
  });

  const fetchAlbums = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/albums?admin=true");
      const data = await res.json();
      // Transform visibility to isPublic for compatibility
      const transformedData = (data || []).map((album: Album) => ({
        ...album,
        isPublic: album.visibility === "public",
      }));
      setAlbums(transformedData);
    } catch {
      console.error("Failed to fetch albums");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/albums/categories");
      const data = await res.json();
      setCategories(data || []);
    } catch {
      console.error("Failed to fetch categories");
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/albums/tags");
      const data = await res.json();
      setTags(data || []);
    } catch {
      console.error("Failed to fetch tags");
    }
  }, []);

  // Fetch all data on mount (albums list doesn't depend on filters - filtered client-side)
  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // Fetch categories and tags only once on mount
  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, [fetchCategories, fetchTags]);

  // Filter albums
  const filteredAlbums = albums.filter((album) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        album.name.toLowerCase().includes(searchLower) ||
        album.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (selectedCategory) {
      if (selectedCategory === "none") {
        if (album.categoryId) return false;
      } else {
        if (album.categoryId?.toString() !== selectedCategory) return false;
      }
    }

    // Tag filter
    if (selectedTag) {
      const hasTag = album.tags?.some((t) => t.id.toString() === selectedTag);
      if (!hasTag) return false;
    }

    return true;
  });

  // Sort albums
  const sortedAlbums = [...filteredAlbums].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "photoCount":
        comparison = a.photoCount - b.photoCount;
        break;
      case "createdAt":
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        break;
      case "isPublic":
        comparison = (a.isPublic ? 1 : 0) - (b.isPublic ? 1 : 0);
        break;
      case "category":
        const aCategory = a.category?.name || "";
        const bCategory = b.category?.name || "";
        comparison = aCategory.localeCompare(bCategory);
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

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      // Search is handled by filter, no need to refetch
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Bulk action handlers
  const handleBulkVisibilityChange = async (isPublic: string) => {
    if (selectedCount === 0) return;
    setIsBulkUpdating(true);
    try {
      const promises = albums
        .filter((a) => isSelected(a.id))
        .map((album) =>
          fetch(`/api/albums/${album.slug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visibility: isPublic === "true" ? "public" : "private" }),
          })
        );
      await Promise.all(promises);
      fetchAlbums();
      clearSelection();
    } catch {
      alert("Failed to update albums");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkCategoryChange = async (categoryId: string) => {
    if (selectedCount === 0) return;
    setIsBulkUpdating(true);
    try {
      const promises = albums
        .filter((a) => isSelected(a.id))
        .map((album) =>
          fetch(`/api/albums/${album.slug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryId: categoryId === "none" ? null : parseInt(categoryId) }),
          })
        );
      await Promise.all(promises);
      fetchAlbums();
      clearSelection();
    } catch {
      alert("Failed to update albums");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;
    if (!confirm(`確定要刪除 ${selectedCount} 個相簿嗎？此操作無法復原。`)) return;
    setIsBulkUpdating(true);
    try {
      const promises = albums
        .filter((a) => isSelected(a.id))
        .map((album) =>
          fetch(`/api/albums/${album.slug}`, { method: "DELETE" })
        );
      await Promise.all(promises);
      fetchAlbums();
      clearSelection();
    } catch {
      alert("Failed to delete albums");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const bulkActions: BulkAction[] = [
    {
      key: "category",
      label: "Move to Category...",
      options: [
        { value: "none", label: "Uncategorized" },
        ...categories.map((c) => ({ value: c.id.toString(), label: c.name })),
      ],
      onAction: (value) => value && handleBulkCategoryChange(value),
    },
    {
      key: "visibility",
      label: "Change Visibility...",
      options: [
        { value: "true", label: "Set as Public" },
        { value: "false", label: "Set as Private" },
      ],
      onAction: (value) => value && handleBulkVisibilityChange(value),
    },
    {
      key: "delete",
      label: "Delete",
      variant: "danger",
      onAction: handleBulkDelete,
    },
  ];

  const handleEdit = async (album: Album) => {
    try {
      const res = await fetch(`/api/albums/${album.slug}?admin=true`);
      const fullAlbum = await res.json();
      setEditingAlbum(fullAlbum);
      setShowModal(true);
    } catch {
      console.error("Failed to fetch album");
    }
  };

  const handleDelete = async (album: Album) => {
    if (!confirm(`確定要刪除「${album.name}」相簿嗎？`)) return;

    try {
      const res = await fetch(`/api/albums/${album.slug}`, { method: "DELETE" });
      if (res.ok) {
        setAlbums(albums.filter((a) => a.id !== album.id));
      } else {
        const data = await res.json();
        alert(data.error || "刪除失敗");
      }
    } catch {
      alert("刪除失敗");
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditingAlbum(null);
    fetchAlbums();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Albums</h1>
        <button
          onClick={() => {
            setEditingAlbum(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Album
        </button>
      </div>

      {/* Filters & View Toggle */}
      <AlbumFilters
        search={search}
        onSearchChange={setSearch}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        categories={categories}
        tags={tags}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        onClear={clearSelection}
        actions={bulkActions}
        disabled={isBulkUpdating}
      />

      {/* Content */}
      {isLoading ? (
        <div className="p-8 text-center text-stone-500">Loading...</div>
      ) : sortedAlbums.length === 0 ? (
        <div className="p-8 text-center text-stone-500 bg-white rounded-lg shadow-sm">
          <Images className="w-16 h-16 mx-auto mb-4 text-stone-300" />
          <p>{albums.length === 0 ? "No albums yet" : "No albums match your filters"}</p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className={`grid ${GRID_CLASSES[gridSize]} gap-4`}>
          {sortedAlbums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              isSelected={isSelected(album.id)}
              showCheckbox={true}
              onSelect={(a) => toggleSelect(a.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Cover
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("photoCount")}
                  >
                    <div className="flex items-center gap-1">
                      Photos
                      <SortIcon field="photoCount" />
                    </div>
                  </th>
                  <th
                    className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-1">
                      Category
                      <SortIcon field="category" />
                    </div>
                  </th>
                  <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("isPublic")}
                  >
                    <div className="flex items-center gap-1">
                      Visibility
                      <SortIcon field="isPublic" />
                    </div>
                  </th>
                  <th
                    className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {sortedAlbums.map((album) => (
                  <tr key={album.id} className={`hover:bg-stone-50 ${isSelected(album.id) ? "bg-stone-50" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected(album.id)}
                        onChange={() => toggleSelect(album.id)}
                        className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative w-16 h-12 rounded overflow-hidden bg-stone-100">
                        {album.coverUrl || album.previewPhotos[0] ? (
                          <Image
                            src={album.coverUrl || album.previewPhotos[0].src}
                            alt={album.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Images className="w-6 h-6 text-stone-300" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-900">{album.name}</div>
                      {album.description && (
                        <div className="text-xs text-stone-500 truncate max-w-xs">
                          {album.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs bg-stone-100 text-stone-700 rounded flex items-center gap-1 w-fit">
                        <Images className="w-3 h-3" />
                        {album.photoCount}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      {album.category ? (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded w-fit">
                          <FolderOpen className="w-3 h-3" />
                          {album.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">-</span>
                      )}
                    </td>
                    <td className="hidden xl:table-cell px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {album.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-stone-100 text-stone-600 rounded"
                          >
                            <Tag className="w-3 h-3" />
                            {tag.name}
                          </span>
                        ))}
                        {album.tags && album.tags.length > 2 && (
                          <span className="px-1.5 py-0.5 text-xs text-stone-400">
                            +{album.tags.length - 2}
                          </span>
                        )}
                        {(!album.tags || album.tags.length === 0) && (
                          <span className="text-xs text-stone-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {album.isPublic ? (
                        <span className="flex items-center gap-1 text-xs text-green-700">
                          <Eye className="w-3 h-3" />
                          Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-stone-500">
                          <EyeOff className="w-3 h-3" />
                          Private
                        </span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-stone-500">
                      {album.createdAt ? new Date(album.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(album)}
                          className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(album)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AlbumModal
          album={editingAlbum}
          onClose={() => {
            setShowModal(false);
            setEditingAlbum(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
