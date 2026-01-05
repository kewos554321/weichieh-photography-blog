"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Images, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { AlbumModal } from "./AlbumModal";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionBar, BulkAction } from "../common/BulkActionBar";

interface Photo {
  id: number;
  slug: string;
  src: string;
  title: string;
}

interface Album {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  photoCount: number;
  previewPhotos: Photo[];
  createdAt?: string;
}

type SortField = "name" | "photoCount" | "createdAt" | "isPublic";
type SortDirection = "asc" | "desc";

export function AlbumListContent() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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
      setAlbums(data || []);
    } catch {
      console.error("Failed to fetch albums");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // Sort albums
  const sortedAlbums = [...albums].sort((a, b) => {
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
            body: JSON.stringify({ isPublic: isPublic === "true" }),
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

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        onClear={clearSelection}
        actions={bulkActions}
        disabled={isBulkUpdating}
      />

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-stone-500">Loading...</div>
        ) : albums.length === 0 ? (
          <div className="p-8 text-center text-stone-500">
            <Images className="w-16 h-16 mx-auto mb-4 text-stone-300" />
            <p>No albums yet</p>
          </div>
        ) : (
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
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("isPublic")}
                  >
                    <div className="flex items-center gap-1">
                      Visibility
                      <SortIcon field="isPublic" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
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
                    <td className="px-4 py-3 text-sm text-stone-500">
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
        )}
      </div>

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
