"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Photo, PhotoTag, Category } from "../types";
import { PhotoModal } from "./PhotoModal";
import { BatchUploadModal } from "./BatchUploadModal";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionBar, BulkAction } from "../common/BulkActionBar";
import {
  LoadingState,
  EmptyState,
  StatusBadge,
  RowActions,
  createEditAction,
  createDeleteAction,
  Pagination,
} from "../shared";
import {
  Plus,
  Search,
  MapPin,
  Filter,
  Upload,
  ChevronUp,
  ChevronDown,
  Loader2,
  Star,
  AlertTriangle,
  X,
  ImageOff,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";

type SortField = "title" | "location" | "category" | "status" | "date";
type SortDirection = "asc" | "desc";
const PAGE_SIZE = 20;

export function PhotoListContent() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tags, setTags] = useState<PhotoTag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [coverPhotoId, setCoverPhotoId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const tableRef = useRef<HTMLDivElement>(null);
  const [deleteModal, setDeleteModal] = useState<{ slug: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchPhotos = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsPageLoading(true);
      }
      const params = new URLSearchParams();
      params.set("admin", "true");
      params.set("limit", PAGE_SIZE.toString());
      params.set("offset", ((pageNum - 1) * PAGE_SIZE).toString());
      params.set("sortField", sortField);
      params.set("sortDirection", sortDirection);
      if (searchQuery) params.set("search", searchQuery);
      if (categoryFilter !== "All") params.set("category", categoryFilter);
      if (tagFilter) params.set("tag", tagFilter);

      const res = await fetch(`/api/photos?${params.toString()}`);
      const data = await res.json();
      setPhotos(data.photos || []);
      setTotal(data.total || 0);
    } catch {
      console.error("Failed to fetch photos");
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  }, [searchQuery, categoryFilter, tagFilter, sortField, sortDirection]);

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

  // Fetch tags, categories, cover photo only once on mount
  useEffect(() => {
    fetchTags();
    fetchCategories();
    fetchCoverPhoto();
  }, [fetchTags, fetchCategories, fetchCoverPhoto]);

  // Fetch photos on initial load and when filters/sort change
  useEffect(() => {
    setPage(1);
    fetchPhotos(1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, categoryFilter, tagFilter, sortField, sortDirection]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPhotos(newPage);
    // Scroll to table top
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDeleteClick = (photo: Photo) => {
    setDeleteModal({ slug: photo.slug, title: photo.title });
  };

  const handleDelete = async (deleteMedia: boolean) => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      const url = deleteMedia
        ? `/api/photos/${deleteModal.slug}?deleteMedia=true`
        : `/api/photos/${deleteModal.slug}`;
      await fetch(url, { method: "DELETE" });
      setPhotos(photos.filter((p) => p.slug !== deleteModal.slug));
      setDeleteModal(null);
    } catch {
      alert("刪除失敗");
    } finally {
      setIsDeleting(false);
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
    fetchPhotos(page, true);
    fetchTags();
  };

  // 合併資料庫分類和預設分類
  const allCategories = categories.length > 0
    ? ["All", ...categories.map((c) => c.name)]
    : ["All", "Portrait", "Landscape", "Street", "Nature"];

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
      fetchPhotos(1, true);
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
      fetchPhotos(1, true);
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

      {/* Table Header with Pagination */}
      <div ref={tableRef} className="bg-white rounded-lg shadow-sm overflow-hidden min-h-[600px]">
        {/* Table Toolbar - Using shared Pagination */}
        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={total}
            itemLabel="photos"
            isLoading={isLoading || isPageLoading}
          />
        </div>

        {/* Table Content */}
        {isLoading ? (
          <LoadingState message="Loading photos..." />
        ) : photos.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="w-full h-full" />}
            title="No photos found"
            description="Try adjusting your search or filters"
          />
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
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-1">
                      Title
                      <SortIcon field="title" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("location")}
                  >
                    <div className="flex items-center gap-1">
                      Location
                      <SortIcon field="location" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-1">
                      Category
                      <SortIcon field="category" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-700"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <SortIcon field="date" />
                    </div>
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
                      <div className="font-medium text-stone-900 flex items-center gap-1.5">
                        {photo.title}
                        {coverPhotoId === photo.id && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs" title="首頁封面">
                            <Star className="w-3 h-3 fill-current" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-stone-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        {photo.location || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        variant={photo.visibility === "public" ? "public" : "private"}
                      />
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
                      <StatusBadge
                        variant={photo.status}
                        scheduledAt={photo.publishedAt}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-500">
                      {new Date(photo.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowActions
                        item={photo}
                        actions={[
                          createEditAction(handleEdit),
                          createDeleteAction(handleDeleteClick),
                        ]}
                      />
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
            fetchPhotos(1, true);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                刪除照片
              </h3>
              <button
                onClick={() => setDeleteModal(null)}
                disabled={isDeleting}
                className="p-1 hover:bg-stone-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-stone-700">
                確定要刪除「<span className="font-medium">{deleteModal.title}</span>」嗎？
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleDelete(false)}
                  disabled={isDeleting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  僅刪除貼文
                  <span className="text-xs text-stone-500">（保留 Media 檔案）</span>
                </button>
                <button
                  onClick={() => handleDelete(true)}
                  disabled={isDeleting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageOff className="w-4 h-4" />
                  )}
                  刪除貼文 + Media 檔案
                </button>
              </div>
              <p className="text-xs text-stone-400 text-center">
                此操作無法復原
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
