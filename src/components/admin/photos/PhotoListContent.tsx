"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import type { Photo, PhotoTag, Category } from "../types";
import { PhotoModal } from "./PhotoModal";
import { BatchUploadModal } from "./BatchUploadModal";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionBar, BulkAction } from "../common/BulkActionBar";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Filter,
  Eye,
  EyeOff,
  Clock,
  Upload,
  Star,
} from "lucide-react";

export function PhotoListContent() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tags, setTags] = useState<PhotoTag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [coverPhotoId, setCoverPhotoId] = useState<number | null>(null);
  const [isSettingCover, setIsSettingCover] = useState(false);

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
    items: photos,
    getItemId: (photo) => photo.id,
  });

  const fetchPhotos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("admin", "true");
      if (searchQuery) params.set("search", searchQuery);
      if (categoryFilter !== "All") params.set("category", categoryFilter);
      if (tagFilter) params.set("tag", tagFilter);

      const res = await fetch(`/api/photos?${params.toString()}`);
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch {
      console.error("Failed to fetch photos");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter, tagFilter]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/photos/tags");
      const data = await res.json();
      setTags(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch tags");
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/photos/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch categories");
    }
  }, []);

  const fetchCoverPhoto = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/cover-photo");
      const data = await res.json();
      setCoverPhotoId(data.photoId || null);
    } catch {
      console.error("Failed to fetch cover photo");
    }
  }, []);

  const handleSetCover = async (photoId: number) => {
    setIsSettingCover(true);
    try {
      const res = await fetch("/api/settings/cover-photo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (res.ok) {
        setCoverPhotoId(photoId);
      }
    } catch {
      alert("設定封面失敗");
    } finally {
      setIsSettingCover(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
    fetchTags();
    fetchCategories();
    fetchCoverPhoto();
  }, [fetchPhotos, fetchTags, fetchCategories, fetchCoverPhoto]);

  const handleDelete = async (slug: string) => {
    if (!confirm("確定要刪除這張照片嗎？")) return;
    try {
      await fetch(`/api/photos/${slug}`, { method: "DELETE" });
      setPhotos(photos.filter((p) => p.slug !== slug));
    } catch {
      alert("刪除失敗");
    }
  };

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingPhoto(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPhoto(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchPhotos();
    fetchTags();
  };

  // 合併資料庫分類和預設分類
  const allCategories = categories.length > 0
    ? ["All", ...categories.map((c) => c.name)]
    : ["All", "Portrait", "Landscape", "Street", "Nature"];

  // Bulk action handlers
  const handleBulkStatusChange = async (status: string) => {
    if (selectedCount === 0) return;
    setIsBulkUpdating(true);
    try {
      const promises = photos
        .filter((p) => isSelected(p.id))
        .map((photo) =>
          fetch(`/api/photos/${photo.slug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
        );
      await Promise.all(promises);
      fetchPhotos();
      clearSelection();
    } catch {
      alert("Failed to update photos");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;
    if (!confirm(`確定要刪除 ${selectedCount} 張照片嗎？此操作無法復原。`)) return;
    setIsBulkUpdating(true);
    try {
      const promises = photos
        .filter((p) => isSelected(p.id))
        .map((photo) =>
          fetch(`/api/photos/${photo.slug}`, { method: "DELETE" })
        );
      await Promise.all(promises);
      fetchPhotos();
      clearSelection();
    } catch {
      alert("Failed to delete photos");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const bulkActions: BulkAction[] = [
    {
      key: "status",
      label: "Change Status...",
      options: [
        { value: "draft", label: "Set as Draft" },
        { value: "published", label: "Publish" },
      ],
      onAction: (value) => value && handleBulkStatusChange(value),
    },
    {
      key: "delete",
      label: "Delete",
      variant: "danger",
      onAction: handleBulkDelete,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Photos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Batch Upload
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Photo
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search photos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 w-64 bg-white"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 appearance-none bg-white"
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
        {tags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white"
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>
        )}
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
        ) : photos.length === 0 ? (
          <div className="p-8 text-center text-stone-500">No photos found</div>
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
                    Photo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {photos.map((photo) => (
                  <tr key={photo.id} className={`hover:bg-stone-50 ${isSelected(photo.id) ? "bg-stone-50" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected(photo.id)}
                        onChange={() => toggleSelect(photo.id)}
                        className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative w-16 h-12 rounded overflow-hidden">
                        <Image
                          src={photo.src}
                          alt={photo.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-900">
                        {photo.title}
                      </div>
                      <div className="text-xs text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {photo.location}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs bg-stone-100 text-stone-700 rounded">
                        {photo.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {photo.tags?.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {photo.status === "published" ? (
                        <span className="flex items-center gap-1 text-xs text-green-700">
                          <Eye className="w-3 h-3" />
                          Published
                        </span>
                      ) : photo.status === "scheduled" ? (
                        <span className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Clock className="w-3 h-3" />
                            Scheduled
                          </span>
                          {photo.publishedAt && (
                            <span className="text-[10px] text-stone-400">
                              {new Date(photo.publishedAt).toLocaleString()}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-stone-500">
                          <EyeOff className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-500">
                      {new Date(photo.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSetCover(photo.id)}
                          disabled={isSettingCover || coverPhotoId === photo.id || photo.visibility !== "public"}
                          className={`p-2 rounded transition-colors ${
                            coverPhotoId === photo.id
                              ? "text-amber-500 bg-amber-50"
                              : photo.visibility !== "public"
                                ? "text-stone-300 cursor-not-allowed"
                                : "text-stone-400 hover:text-amber-500 hover:bg-amber-50"
                          }`}
                          title={
                            coverPhotoId === photo.id
                              ? "目前首頁封面"
                              : photo.visibility !== "public"
                                ? "私人照片無法設為首頁封面"
                                : "設為首頁封面"
                          }
                        >
                          <Star className={`w-4 h-4 ${coverPhotoId === photo.id ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleEdit(photo)}
                          className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(photo.slug)}
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
      {isModalOpen && (
        <PhotoModal
          photo={editingPhoto}
          tags={tags}
          categories={categories}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Batch Upload Modal */}
      {isBatchModalOpen && (
        <BatchUploadModal
          onClose={() => setIsBatchModalOpen(false)}
          onSuccess={() => {
            setIsBatchModalOpen(false);
            fetchPhotos();
          }}
        />
      )}
    </div>
  );
}
