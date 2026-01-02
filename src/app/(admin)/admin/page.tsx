"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useUpload } from "@/hooks/useUpload";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Tag,
  Calendar,
  MapPin,
  Camera,
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  Filter,
  Eye,
  EyeOff,
  Clock,
  Upload,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";

type Tab = "photos" | "articles";

interface PhotoTag {
  id: number;
  name: string;
}

interface ArticleTag {
  id: number;
  name: string;
}

interface Photo {
  id: number;
  slug: string;
  title: string;
  src: string;
  category: string;
  location: string;
  date: string;
  camera?: string;
  lens?: string;
  story: string;
  behindTheScene?: string;
  status: "draft" | "scheduled" | "published";
  publishedAt?: string;
  tags: PhotoTag[];
}

interface Article {
  id: number;
  slug: string;
  title: string;
  cover: string;
  category: string;
  excerpt: string;
  content: string;
  date: string;
  status: "draft" | "scheduled" | "published";
  publishedAt?: string;
  readTime: number;
  tags: ArticleTag[];
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("photos");

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-stone-900 text-white">
        <nav className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-serif text-xl">
              WeiChieh
            </Link>
            <span className="text-stone-500">|</span>
            <span className="text-sm text-stone-400">Admin</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-stone-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Site
          </Link>
        </nav>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("photos")}
              className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "photos"
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Photos
            </button>
            <button
              onClick={() => setActiveTab("articles")}
              className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "articles"
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              Articles
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {activeTab === "photos" ? <PhotosTab /> : <ArticlesTab />}
      </main>
    </div>
  );
}

// ============================================
// Photos Tab
// ============================================
function PhotosTab() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tags, setTags] = useState<PhotoTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const categories = ["All", "Portrait", "Landscape", "Street", "Nature"];

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

  useEffect(() => {
    fetchPhotos();
    fetchTags();
  }, [fetchPhotos, fetchTags]);

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

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search photos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 w-64"
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
              {categories.map((cat) => (
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

        {/* Add Buttons */}
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
                  <tr key={photo.id} className="hover:bg-stone-50">
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

// ============================================
// Batch Upload Modal
// ============================================
interface BatchUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadFile {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  publicUrl?: string;
  error?: string;
}

function BatchUploadModal({ onClose, onSuccess }: BatchUploadModalProps) {
  const { uploadBatch, isUploading, progress } = useUpload();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles = fileArray.filter((f) =>
      ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
    );

    const uploadFiles: UploadFile[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    // Mark all as uploading
    setFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" })));

    try {
      const results = await uploadBatch(
        files.map((f) => f.file),
        "photos",
        (completed, total, filename) => {
          setCurrentFileIndex(completed);
          setFiles((prev) =>
            prev.map((f, i) =>
              i < completed ? { ...f, status: "done" } : f
            )
          );
        }
      );

      // 建立資料庫記錄
      const createPromises = results.map(async (result, index) => {
        const file = files[index].file;
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        const title = nameWithoutExt.replace(/[-_]/g, " ");
        const slug = nameWithoutExt
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-") + "-" + Date.now();

        await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            title,
            src: result.publicUrl,
            category: "Portrait",
            location: "未設定",
            date: new Date().toISOString().split("T")[0],
            story: "待編輯...",
            status: "draft",
          }),
        });
      });

      await Promise.all(createPromises);

      // Update with results
      setFiles((prev) =>
        prev.map((f, i) => ({
          ...f,
          status: "done",
          publicUrl: results[i]?.publicUrl,
        }))
      );
      setUploadComplete(true);
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? { ...f, status: "error", error: "Upload failed" }
            : f
        )
      );
    }
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Batch Upload Photos
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Drop Zone */}
          {!uploadComplete && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-stone-900 bg-stone-50"
                  : "border-stone-300 hover:border-stone-400"
              }`}
            >
              <Upload className="w-10 h-10 mx-auto text-stone-400 mb-3" />
              <p className="text-stone-600 mb-2">
                Drag and drop images here, or
              </p>
              <label className="inline-block px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 cursor-pointer transition-colors">
                Browse Files
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-stone-400 mt-3">
                Supports: JPEG, PNG, WebP, GIF (Max 20 files, 10MB each)
              </p>
            </div>
          )}

          {/* Preview Grid */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">
                  {files.length} file{files.length > 1 ? "s" : ""} selected
                </span>
                {!uploadComplete && !isUploading && (
                  <button
                    onClick={() => setFiles([])}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <Image
                      src={file.preview}
                      alt={file.file.name}
                      fill
                      className="object-cover"
                    />
                    {/* Status overlay */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center ${
                        file.status === "pending"
                          ? "bg-black/0 group-hover:bg-black/40"
                          : file.status === "uploading"
                          ? "bg-black/40"
                          : file.status === "done"
                          ? "bg-green-500/30"
                          : "bg-red-500/30"
                      }`}
                    >
                      {file.status === "pending" && !isUploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {file.status === "uploading" && (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {file.status === "done" && (
                        <CheckCircle className="w-8 h-8 text-white" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="w-8 h-8 text-white" />
                      )}
                    </div>
                    {/* Filename */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                      <p className="text-xs text-white truncate">
                        {file.file.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-stone-600">
                <span>Uploading...</span>
                <span>
                  {currentFileIndex} / {files.length}
                </span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2">
                <div
                  className="bg-stone-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadComplete && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Upload Complete!</p>
                <p className="text-sm">
                  {files.length} photos uploaded successfully. You can now edit
                  each photo to add details.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-4 border-t border-stone-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
          >
            {uploadComplete ? "Close" : "Cancel"}
          </button>
          {!uploadComplete && (
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
              className="px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors disabled:bg-stone-400"
            >
              {isUploading ? "Uploading..." : `Upload ${files.length} Photos`}
            </button>
          )}
          {uploadComplete && (
            <button
              onClick={onSuccess}
              className="px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Photo Modal
// ============================================
interface PhotoModalProps {
  photo: Photo | null;
  tags: PhotoTag[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ArticleOption {
  id: number;
  slug: string;
  title: string;
}

function PhotoModal({ photo, tags, onClose, onSuccess }: PhotoModalProps) {
  const { upload, isUploading, progress } = useUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    photo?.src || null
  );
  const [newTagName, setNewTagName] = useState("");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [articles, setArticles] = useState<ArticleOption[]>([]);

  const [formData, setFormData] = useState({
    title: photo?.title || "",
    slug: photo?.slug || "",
    category: photo?.category || "Portrait",
    location: photo?.location || "",
    date: photo?.date ? photo.date.split("T")[0] : "",
    camera: photo?.camera || "",
    lens: photo?.lens || "",
    story: photo?.story || "",
    behindTheScene: photo?.behindTheScene || "",
    image: null as File | null,
    tagIds: photo?.tags?.map((t) => t.id) || ([] as number[]),
    status: photo?.status || ("draft" as "draft" | "scheduled" | "published"),
    publishedAt: photo?.publishedAt
      ? photo.publishedAt.slice(0, 16)
      : "",
    articleId: (photo as Photo & { articleId?: number })?.articleId || null as number | null,
  });

  // 載入可選的文章列表
  useEffect(() => {
    fetch("/api/articles?admin=true&limit=100")
      .then((res) => res.json())
      .then((data) => setArticles(data.articles || []))
      .catch(() => setArticles([]));
  }, []);

  const isEditMode = !!photo;

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormData({ ...formData, title, slug: isEditMode ? formData.slug : slug });
  };

  const handleImageChange = (file: File | null) => {
    setFormData({ ...formData, image: file });
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
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
      const res = await fetch("/api/photos/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      if (res.ok) {
        const newTag = await res.json();
        tags.push(newTag);
        setFormData({ ...formData, tagIds: [...formData.tagIds, newTag.id] });
        setNewTagName("");
      }
    } catch {
      console.error("Failed to add tag");
    }
  };

  const handleGenerateStory = async () => {
    // 需要有圖片才能生成
    const imageUrl = imagePreview?.startsWith("data:") ? null : imagePreview;
    if (!imageUrl && !formData.image) {
      setError("請先上傳圖片才能使用 AI 生成故事");
      return;
    }

    setIsGeneratingStory(true);
    setError(null);

    try {
      // 如果是新上傳的圖片，需要先上傳
      let uploadedUrl = imageUrl;
      if (formData.image && !imageUrl) {
        const { publicUrl } = await upload(formData.image, "photos");
        uploadedUrl = publicUrl;
        setImagePreview(publicUrl);
      }

      const res = await fetch("/api/ai/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadedUrl,
          prompt: aiPrompt || undefined,
          language: "zh",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "生成失敗");
      }

      const data = await res.json();

      // 處理 AI 建議的 tags（自動新增不存在的標籤）
      const aiTagIds: number[] = [];
      if (data.tags && Array.isArray(data.tags)) {
        for (const tagName of data.tags) {
          // 檢查標籤是否已存在
          const existingTag = tags.find(
            (t) => t.name.toLowerCase() === tagName.toLowerCase()
          );
          if (existingTag) {
            aiTagIds.push(existingTag.id);
          } else {
            // 建立新標籤
            try {
              const tagRes = await fetch("/api/photos/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: tagName }),
              });
              if (tagRes.ok) {
                const newTag = await tagRes.json();
                tags.push(newTag);
                aiTagIds.push(newTag.id);
              }
            } catch {
              console.error("Failed to create tag:", tagName);
            }
          }
        }
      }

      // 更新表單（包含 title、story、category、tags）
      const newSlug = data.title
        ? data.title
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-") + "-" + Date.now()
        : formData.slug;

      setFormData({
        ...formData,
        title: data.title || formData.title,
        slug: isEditMode ? formData.slug : newSlug,
        story: data.story || formData.story,
        category: data.category || formData.category,
        tagIds: aiTagIds.length > 0 ? aiTagIds : formData.tagIds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 生成失敗");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let imageSrc = photo?.src;

      // 上傳新圖片
      if (formData.image) {
        const { publicUrl } = await upload(formData.image, "photos");
        imageSrc = publicUrl;
      } else if (!isEditMode) {
        throw new Error("Please select an image");
      }

      const payload = {
        slug: formData.slug,
        title: formData.title,
        src: imageSrc,
        category: formData.category,
        location: formData.location,
        date: formData.date,
        camera: formData.camera || null,
        lens: formData.lens || null,
        story: formData.story,
        behindTheScene: formData.behindTheScene || null,
        tagIds: formData.tagIds,
        status: formData.status,
        publishedAt:
          formData.status === "scheduled" && formData.publishedAt
            ? formData.publishedAt
            : null,
        articleId: formData.articleId,
      };

      const url = isEditMode ? `/api/photos/${photo.slug}` : "/api/photos";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save photo");
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
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            {isEditMode ? "Edit Photo" : "Add New Photo"}
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
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500"
                required
                disabled={isEditMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
                <option value="Portrait">Portrait</option>
                <option value="Landscape">Landscape</option>
                <option value="Street">Street</option>
                <option value="Nature">Nature</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                <Camera className="w-3 h-3 inline mr-1" />
                Camera
              </label>
              <input
                type="text"
                value={formData.camera}
                onChange={(e) =>
                  setFormData({ ...formData, camera: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="e.g. Sony A7IV"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Lens
              </label>
              <input
                type="text"
                value={formData.lens}
                onChange={(e) =>
                  setFormData({ ...formData, lens: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="e.g. 85mm f/1.4"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Tag className="w-3 h-3 inline mr-1" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    formData.tagIds.includes(tag.id)
                      ? "bg-blue-500 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Add new tag..."
                className="flex-1 px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-stone-100 text-stone-700 rounded-md hover:bg-stone-200 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Image {!isEditMode && "*"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
              required={!isEditMode}
            />
            {imagePreview && (
              <div className="mt-2 relative aspect-video w-full max-w-xs overflow-hidden rounded-md">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Story */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-stone-700">
                Story *
              </label>
              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={isGeneratingStory || (!imagePreview && !formData.image)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingStory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI 自動填寫
                  </>
                )}
              </button>
            </div>

            {/* AI Prompt Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="可選：輸入提示詞引導 AI（AI 將自動填寫標題、分類、標籤、故事）"
                className="flex-1 px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/50"
              />
            </div>

            <textarea
              value={formData.story}
              onChange={(e) =>
                setFormData({ ...formData, story: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="描述這張照片背後的故事..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Behind The Scene
            </label>
            <textarea
              value={formData.behindTheScene}
              onChange={(e) =>
                setFormData({ ...formData, behindTheScene: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>

          {/* Link to Article */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              <FileText className="w-3 h-3 inline mr-1" />
              關聯文章（閱讀完整故事）
            </label>
            <select
              value={formData.articleId || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  articleId: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
            >
              <option value="">無（不連結文章）</option>
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-stone-400 mt-1">
              選擇後，照片頁面會顯示「閱讀完整故事」按鈕
            </p>
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
                  name="status"
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
                  name="status"
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
                  name="status"
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
              {isSubmitting || isUploading ? "Saving..." : isEditMode ? "Save Changes" : "Create Photo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Articles Tab
// ============================================
function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<ArticleTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [tagFilter, setTagFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const categories = ["全部", "技巧分享", "旅行日記", "攝影思考"];

  const fetchArticles = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("admin", "true");
      if (searchQuery) params.set("search", searchQuery);
      if (categoryFilter !== "全部") params.set("category", categoryFilter);
      if (tagFilter) params.set("tag", tagFilter);

      const res = await fetch(`/api/articles?${params.toString()}`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch {
      console.error("Failed to fetch articles");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter, tagFilter]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/articles/tags");
      const data = await res.json();
      setTags(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch tags");
    }
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchTags();
  }, [fetchArticles, fetchTags]);

  const handleDelete = async (slug: string) => {
    if (!confirm("確定要刪除這篇文章嗎？")) return;
    try {
      await fetch(`/api/articles/${slug}`, { method: "DELETE" });
      setArticles(articles.filter((a) => a.slug !== slug));
    } catch {
      alert("刪除失敗");
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingArticle(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingArticle(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchArticles();
    fetchTags();
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 w-64"
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
              {categories.map((cat) => (
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

        {/* Add Button */}
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Article
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-stone-500">Loading...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-stone-500">No articles found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Cover
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
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <div className="relative w-20 h-12 rounded overflow-hidden">
                        <Image
                          src={article.cover}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-900 max-w-xs truncate">
                        {article.title}
                      </div>
                      <div className="text-xs text-stone-500">
                        {article.readTime} min read
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs bg-stone-100 text-stone-700 rounded">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {article.tags?.map((tag) => (
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
                      {article.status === "published" ? (
                        <span className="flex items-center gap-1 text-xs text-green-700">
                          <Eye className="w-3 h-3" />
                          Published
                        </span>
                      ) : article.status === "scheduled" ? (
                        <span className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Clock className="w-3 h-3" />
                            Scheduled
                          </span>
                          {article.publishedAt && (
                            <span className="text-[10px] text-stone-400">
                              {new Date(article.publishedAt).toLocaleString()}
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
                      {new Date(article.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(article)}
                          className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(article.slug)}
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
        <ArticleModal
          article={editingArticle}
          tags={tags}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

// ============================================
// Article Modal
// ============================================
interface ArticleModalProps {
  article: Article | null;
  tags: ArticleTag[];
  onClose: () => void;
  onSuccess: () => void;
}

function ArticleModal({ article, tags, onClose, onSuccess }: ArticleModalProps) {
  const { upload, isUploading, progress } = useUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    article?.cover || null
  );
  const [newTagName, setNewTagName] = useState("");

  const [formData, setFormData] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    category: article?.category || "技巧分享",
    excerpt: article?.excerpt || "",
    content: article?.content || "",
    cover: null as File | null,
    status: article?.status || ("draft" as "draft" | "scheduled" | "published"),
    publishedAt: article?.publishedAt
      ? article.publishedAt.slice(0, 16)
      : "",
    tagIds: article?.tags?.map((t) => t.id) || ([] as number[]),
  });

  const isEditMode = !!article;

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormData({ ...formData, title, slug: isEditMode ? formData.slug : slug });
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
      const res = await fetch("/api/articles/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      if (res.ok) {
        const newTag = await res.json();
        tags.push(newTag);
        setFormData({ ...formData, tagIds: [...formData.tagIds, newTag.id] });
        setNewTagName("");
      }
    } catch {
      console.error("Failed to add tag");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let coverUrl = article?.cover;

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

      const url = isEditMode ? `/api/articles/${article.slug}` : "/api/articles";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save article");
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
            {isEditMode ? "Edit Article" : "Add New Article"}
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
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500"
                required
                disabled={isEditMode}
              />
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
              <option value="技巧分享">技巧分享</option>
              <option value="旅行日記">旅行日記</option>
              <option value="攝影思考">攝影思考</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Tag className="w-3 h-3 inline mr-1" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    formData.tagIds.includes(tag.id)
                      ? "bg-blue-500 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Add new tag..."
                className="flex-1 px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-stone-100 text-stone-700 rounded-md hover:bg-stone-200 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
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

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Content (Markdown) *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={10}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 font-mono text-sm"
              placeholder="## Heading&#10;&#10;Your content here..."
              required
            />
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
                  name="article-status"
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
                  name="article-status"
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
                  name="article-status"
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
              {isSubmitting || isUploading ? "Saving..." : isEditMode ? "Save Changes" : "Create Article"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
