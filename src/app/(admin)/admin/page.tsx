"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useUpload } from "@/hooks/useUpload";
import MarkdownContent from "@/components/MarkdownContent";
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
  Settings,
  FolderOpen,
  GripVertical,
  User,
  List,
  Globe,
  BarChart3,
} from "lucide-react";

// Dynamic import for MapPickerModal to avoid SSR issues with Leaflet
const MapPickerModal = dynamic(
  () => import("@/components/MapPickerModal"),
  { ssr: false }
);

type Section = "photos" | "articles" | "analytics" | "settings";
type PhotoTab = "list" | "categories" | "tags";
type ArticleTab = "list" | "categories" | "tags";
type SettingsTab = "profile" | "seo";

interface PhotoTag {
  id: number;
  name: string;
  _count?: { photos: number };
}

interface ArticleTag {
  id: number;
  name: string;
  _count?: { articles: number };
}

interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

interface Photo {
  id: number;
  slug: string;
  title: string;
  src: string;
  category: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
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
  const [activeSection, setActiveSection] = useState<Section>("photos");
  const [photoTab, setPhotoTab] = useState<PhotoTab>("list");
  const [articleTab, setArticleTab] = useState<ArticleTab>("list");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("profile");

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-white flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-4 border-b border-stone-700">
          <Link href="/" className="flex items-center gap-2 text-lg font-serif">
            <span>WeiChieh</span>
            <span className="text-stone-500 text-sm">Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {/* Photos Section */}
          <button
            onClick={() => setActiveSection("photos")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeSection === "photos"
                ? "bg-white/10 text-white"
                : "text-stone-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            Photos
          </button>
          {activeSection === "photos" && (
            <div className="ml-4 mt-1 space-y-0.5">
              <button
                onClick={() => setPhotoTab("list")}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                  photoTab === "list" ? "bg-white/10 text-white" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <List className="w-4 h-4" />
                All Photos
              </button>
              <button
                onClick={() => setPhotoTab("categories")}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                  photoTab === "categories" ? "bg-white/10 text-white" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                Categories
              </button>
              <button
                onClick={() => setPhotoTab("tags")}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                  photoTab === "tags" ? "bg-white/10 text-white" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <Tag className="w-4 h-4" />
                Tags
              </button>
            </div>
          )}

          {/* Articles Section */}
          <button
            onClick={() => setActiveSection("articles")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeSection === "articles"
                ? "bg-white/10 text-white"
                : "text-stone-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileText className="w-5 h-5" />
            Articles
          </button>
          {activeSection === "articles" && (
            <div className="ml-4 mt-1 space-y-0.5">
              <button
                onClick={() => setArticleTab("list")}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                  articleTab === "list" ? "bg-white/10 text-white" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <List className="w-4 h-4" />
                All Articles
              </button>
              <button
                onClick={() => setArticleTab("categories")}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                  articleTab === "categories" ? "bg-white/10 text-white" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                Categories
              </button>
              <button
                onClick={() => setArticleTab("tags")}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                  articleTab === "tags" ? "bg-white/10 text-white" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <Tag className="w-4 h-4" />
                Tags
              </button>
            </div>
          )}

          {/* Analytics Section */}
          <button
            onClick={() => setActiveSection("analytics")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeSection === "analytics"
                ? "bg-white/10 text-white"
                : "text-stone-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </button>

          {/* Settings Section */}
          <div className="pt-4 mt-4 border-t border-stone-700">
            <button
              onClick={() => setActiveSection("settings")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeSection === "settings"
                  ? "bg-white/10 text-white"
                  : "text-stone-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </div>
          {activeSection === "settings" && (
            <div className="ml-4 mt-1 space-y-0.5">
              <button
                onClick={() => setSettingsTab("profile")}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                  settingsTab === "profile" ? "bg-white/10 text-white" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => setSettingsTab("seo")}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                  settingsTab === "seo" ? "bg-white/10 text-white" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <Globe className="w-4 h-4" />
                SEO & Analytics
              </button>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-stone-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {activeSection === "photos" && <PhotosSection activeTab={photoTab} />}
        {activeSection === "articles" && <ArticlesSection activeTab={articleTab} />}
        {activeSection === "analytics" && <AnalyticsSection />}
        {activeSection === "settings" && <SettingsSection activeTab={settingsTab} />}
      </main>
    </div>
  );
}

// ============================================
// Settings Section
// ============================================
interface SettingsSectionProps {
  activeTab: SettingsTab;
}

function SettingsSection({ activeTab }: SettingsSectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Settings</h1>
      {activeTab === "profile" && <ProfileManager />}
      {activeTab === "seo" && <SEOManager />}
    </div>
  );
}

// ============================================
// Analytics Section
// ============================================
interface AnalyticsData {
  overview: {
    totalPhotos: number;
    totalArticles: number;
    publishedPhotos: number;
    publishedArticles: number;
    draftPhotos: number;
    draftArticles: number;
    totalViews: number;
    photoViews: number;
    articleViews: number;
    recentPhotos: number;
    recentArticles: number;
  };
  topPhotos: Array<{
    id: number;
    slug: string;
    title: string;
    src: string;
    viewCount: number;
    category: string;
  }>;
  topArticles: Array<{
    id: number;
    slug: string;
    title: string;
    cover: string;
    viewCount: number;
    category: string;
  }>;
  photoCategoryStats: Array<{
    category: string;
    count: number;
    views: number;
  }>;
  articleCategoryStats: Array<{
    category: string;
    count: number;
    views: number;
  }>;
}

function AnalyticsSection() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-stone-500">
        Failed to load analytics
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-stone-900">Analytics</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{data.overview.totalViews.toLocaleString()}</p>
              <p className="text-sm text-stone-500">Total Views</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <ImageIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{data.overview.publishedPhotos}</p>
              <p className="text-sm text-stone-500">Published Photos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{data.overview.publishedArticles}</p>
              <p className="text-sm text-stone-500">Published Articles</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{data.overview.draftPhotos + data.overview.draftArticles}</p>
              <p className="text-sm text-stone-500">Drafts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Views Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium text-stone-900 mb-4">Photo Views</h2>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-semibold text-stone-900">{data.overview.photoViews.toLocaleString()}</span>
            <span className="text-sm text-stone-500 mb-1">total views</span>
          </div>
          <div className="mt-4 h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${data.overview.totalViews > 0 ? (data.overview.photoViews / data.overview.totalViews) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium text-stone-900 mb-4">Article Views</h2>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-semibold text-stone-900">{data.overview.articleViews.toLocaleString()}</span>
            <span className="text-sm text-stone-500 mb-1">total views</span>
          </div>
          <div className="mt-4 h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${data.overview.totalViews > 0 ? (data.overview.articleViews / data.overview.totalViews) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Photos */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <h2 className="text-lg font-medium text-stone-900">Top Photos</h2>
          </div>
          {data.topPhotos.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No data yet</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.topPhotos.map((photo, index) => (
                <div key={photo.id} className="flex items-center gap-4 p-4 hover:bg-stone-50">
                  <span className="text-lg font-medium text-stone-400 w-6">{index + 1}</span>
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    <Image src={photo.src} alt={photo.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">{photo.title}</p>
                    <p className="text-xs text-stone-500">{photo.category}</p>
                  </div>
                  <div className="flex items-center gap-1 text-stone-500">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{photo.viewCount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Articles */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <h2 className="text-lg font-medium text-stone-900">Top Articles</h2>
          </div>
          {data.topArticles.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No data yet</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.topArticles.map((article, index) => (
                <div key={article.id} className="flex items-center gap-4 p-4 hover:bg-stone-50">
                  <span className="text-lg font-medium text-stone-400 w-6">{index + 1}</span>
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    <Image src={article.cover} alt={article.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">{article.title}</p>
                    <p className="text-xs text-stone-500">{article.category}</p>
                  </div>
                  <div className="flex items-center gap-1 text-stone-500">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{article.viewCount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Photo Categories */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <h2 className="text-lg font-medium text-stone-900">Photo Categories</h2>
          </div>
          {data.photoCategoryStats.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No data yet</div>
          ) : (
            <div className="p-4 space-y-3">
              {data.photoCategoryStats.map((stat) => (
                <div key={stat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 text-xs bg-stone-100 text-stone-700 rounded">{stat.category}</span>
                    <span className="text-sm text-stone-500">{stat.count} photos</span>
                  </div>
                  <span className="text-sm font-medium text-stone-900">{stat.views.toLocaleString()} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Article Categories */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <h2 className="text-lg font-medium text-stone-900">Article Categories</h2>
          </div>
          {data.articleCategoryStats.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No data yet</div>
          ) : (
            <div className="p-4 space-y-3">
              {data.articleCategoryStats.map((stat) => (
                <div key={stat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 text-xs bg-stone-100 text-stone-700 rounded">{stat.category}</span>
                    <span className="text-sm text-stone-500">{stat.count} articles</span>
                  </div>
                  <span className="text-sm font-medium text-stone-900">{stat.views.toLocaleString()} views</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Last 30 Days</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center p-4 bg-stone-50 rounded-lg">
            <p className="text-3xl font-semibold text-green-600">{data.overview.recentPhotos}</p>
            <p className="text-sm text-stone-500 mt-1">New Photos Published</p>
          </div>
          <div className="text-center p-4 bg-stone-50 rounded-lg">
            <p className="text-3xl font-semibold text-purple-600">{data.overview.recentArticles}</p>
            <p className="text-sm text-stone-500 mt-1">New Articles Published</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Category Manager Component (Reusable)
// ============================================
interface CategoryManagerProps {
  title: string;
  apiPath: string;
  itemLabel: string;
}

function CategoryManager({ title, apiPath, itemLabel }: CategoryManagerProps) {
  const [items, setItems] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(apiPath);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      console.error(`Failed to fetch ${itemLabel}`);
    } finally {
      setIsLoading(false);
    }
  }, [apiPath, itemLabel]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setError(null);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), sortOrder: items.length }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }
      setNewName("");
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return;
    setError(null);
    try {
      const res = await fetch(`${apiPath}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      setEditingId(null);
      setEditingName("");
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`確定要刪除此${itemLabel}嗎？`)) return;
    setError(null);
    try {
      const res = await fetch(`${apiPath}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const startEdit = (item: Category) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-stone-900 mb-4">{title}</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Add New */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`新增${itemLabel}...`}
          className="flex-1 px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center text-stone-500 py-8">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-stone-500 py-8">尚無{itemLabel}</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg group"
            >
              <GripVertical className="w-4 h-4 text-stone-300" />
              {editingId === item.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(item.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdate(item.id)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 text-stone-500 hover:bg-stone-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-stone-700">{item.name}</span>
                  <span className="text-xs text-stone-400 font-mono">{item.slug}</span>
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Tag Manager Component (Reusable)
// ============================================
interface TagManagerProps {
  title: string;
  apiPath: string;
  countField: string;
}

function TagManager({ title, apiPath, countField }: TagManagerProps) {
  const [items, setItems] = useState<(PhotoTag | ArticleTag)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(apiPath);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch tags");
    } finally {
      setIsLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setError(null);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }
      setNewName("");
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return;
    setError(null);
    try {
      const res = await fetch(`${apiPath}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      setEditingId(null);
      setEditingName("");
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除此標籤嗎？")) return;
    setError(null);
    try {
      const res = await fetch(`${apiPath}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const startEdit = (item: PhotoTag | ArticleTag) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const getCount = (item: PhotoTag | ArticleTag) => {
    const count = item._count as Record<string, number> | undefined;
    return count?.[countField] ?? 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-stone-900 mb-4">{title}</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Add New */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新增標籤..."
          className="flex-1 px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center text-stone-500 py-8">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-stone-500 py-8">尚無標籤</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                editingId === item.id
                  ? "border-stone-400 bg-white"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300"
              }`}
            >
              {editingId === item.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-24 px-1 py-0.5 text-sm border-none focus:outline-none bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(item.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdate(item.id)}
                    className="p-0.5 text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-0.5 text-stone-500 hover:text-stone-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-stone-700">{item.name}</span>
                  <span className="text-xs text-stone-400">({getCount(item)})</span>
                  <button
                    onClick={() => startEdit(item)}
                    className="p-0.5 text-stone-400 hover:text-stone-700"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-0.5 text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Specific Managers
function PhotoCategoriesManager() {
  return (
    <CategoryManager
      title="Photo Categories"
      apiPath="/api/photos/categories"
      itemLabel="分類"
    />
  );
}

function PhotoTagsManager() {
  return (
    <TagManager
      title="Photo Tags"
      apiPath="/api/photos/tags"
      countField="photos"
    />
  );
}

function ArticleCategoriesManager() {
  return (
    <CategoryManager
      title="Article Categories"
      apiPath="/api/articles/categories"
      itemLabel="分類"
    />
  );
}

function ArticleTagsManager() {
  return (
    <TagManager
      title="Article Tags"
      apiPath="/api/articles/tags"
      countField="articles"
    />
  );
}

// ============================================
// Profile Manager Component
// ============================================
interface ProfileData {
  name: string;
  title: string;
  bio: string;
  avatar: string;
  email: string;
  location: string;
  socialLinks: {
    instagram: string;
    twitter: string;
    youtube: string;
    website: string;
  };
  equipment: {
    cameras: string[];
    lenses: string[];
    accessories: string[];
  };
  philosophy: string;
  services: string[];
}

function ProfileManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    title: "",
    bio: "",
    avatar: "",
    email: "",
    location: "",
    socialLinks: { instagram: "", twitter: "", youtube: "", website: "" },
    equipment: { cameras: [], lenses: [], accessories: [] },
    philosophy: "",
    services: [],
  });
  const [newEquipment, setNewEquipment] = useState({ cameras: "", lenses: "", accessories: "" });
  const [newService, setNewService] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/settings/profile");
        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        alert("Profile saved successfully!");
      } else {
        alert("Failed to save profile");
      }
    } catch {
      alert("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfile({ ...profile, avatar: data.url });
      } else {
        alert("Failed to upload avatar");
      }
    } catch {
      alert("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const addEquipment = (type: "cameras" | "lenses" | "accessories") => {
    const value = newEquipment[type].trim();
    if (!value) return;
    setProfile({
      ...profile,
      equipment: {
        ...profile.equipment,
        [type]: [...profile.equipment[type], value],
      },
    });
    setNewEquipment({ ...newEquipment, [type]: "" });
  };

  const removeEquipment = (type: "cameras" | "lenses" | "accessories", index: number) => {
    setProfile({
      ...profile,
      equipment: {
        ...profile.equipment,
        [type]: profile.equipment[type].filter((_, i) => i !== index),
      },
    });
  };

  const addService = () => {
    const value = newService.trim();
    if (!value) return;
    setProfile({
      ...profile,
      services: [...profile.services, value],
    });
    setNewService("");
  };

  const removeService = (index: number) => {
    setProfile({
      ...profile,
      services: profile.services.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Avatar Section */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-stone-200">
            {profile.avatar ? (
              <Image src={profile.avatar} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-stone-400" />
              </div>
            )}
          </div>
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 cursor-pointer transition-colors">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            <p className="text-xs text-stone-500 mt-2">Recommended: Square image, at least 200x200px</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Basic Information</h2>
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Display Name *</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="WeiChieh"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
              <input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="Photographer & Writer"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
              placeholder="Tell visitors about yourself..."
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="hello@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="Taiwan"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Social Links</h2>
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Instagram</label>
              <input
                type="url"
                value={profile.socialLinks.instagram}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, instagram: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="https://instagram.com/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Twitter / X</label>
              <input
                type="url"
                value={profile.socialLinks.twitter}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, twitter: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="https://twitter.com/username"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">YouTube</label>
              <input
                type="url"
                value={profile.socialLinks.youtube}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, youtube: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="https://youtube.com/@channel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Website</label>
              <input
                type="url"
                value={profile.socialLinks.website}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, website: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Photography Philosophy</h2>
        <textarea
          value={profile.philosophy}
          onChange={(e) => setProfile({ ...profile, philosophy: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
          placeholder="Share your photography philosophy and approach..."
        />
      </div>

      {/* Equipment */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Equipment</h2>
        <div className="space-y-6">
          {/* Cameras */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Cameras</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newEquipment.cameras}
                onChange={(e) => setNewEquipment({ ...newEquipment, cameras: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addEquipment("cameras")}
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="e.g., Sony A7R V"
              />
              <button
                onClick={() => addEquipment("cameras")}
                className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.equipment.cameras.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
                >
                  {item}
                  <button onClick={() => removeEquipment("cameras", i)} className="text-stone-400 hover:text-stone-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Lenses */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Lenses</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newEquipment.lenses}
                onChange={(e) => setNewEquipment({ ...newEquipment, lenses: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addEquipment("lenses")}
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="e.g., Sony 24-70mm f/2.8 GM"
              />
              <button
                onClick={() => addEquipment("lenses")}
                className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.equipment.lenses.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
                >
                  {item}
                  <button onClick={() => removeEquipment("lenses", i)} className="text-stone-400 hover:text-stone-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Accessories */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Accessories</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newEquipment.accessories}
                onChange={(e) => setNewEquipment({ ...newEquipment, accessories: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addEquipment("accessories")}
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="e.g., Peak Design Tripod"
              />
              <button
                onClick={() => addEquipment("accessories")}
                className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.equipment.accessories.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
                >
                  {item}
                  <button onClick={() => removeEquipment("accessories", i)} className="text-stone-400 hover:text-stone-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Services</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addService()}
            className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
            placeholder="e.g., Portrait Photography"
          />
          <button
            onClick={addService}
            className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.services.map((service, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
            >
              {service}
              <button onClick={() => removeService(i)} className="text-stone-400 hover:text-stone-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// SEO Manager Component
// ============================================
interface SEOData {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string[];
  ogImage: string;
  twitterHandle: string;
  googleAnalyticsId: string;
  googleSearchConsoleId: string;
  facebookPixelId: string;
}

function SEOManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [seo, setSeo] = useState<SEOData>({
    siteTitle: "",
    siteDescription: "",
    siteKeywords: [],
    ogImage: "",
    twitterHandle: "",
    googleAnalyticsId: "",
    googleSearchConsoleId: "",
    facebookPixelId: "",
  });
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const res = await fetch("/api/settings/seo");
        const data = await res.json();
        setSeo(data);
      } catch (error) {
        console.error("Failed to fetch SEO settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSEO();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seo),
      });
      if (res.ok) {
        alert("SEO settings saved successfully!");
      } else {
        alert("Failed to save SEO settings");
      }
    } catch {
      alert("Failed to save SEO settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "og-image");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSeo({ ...seo, ogImage: data.url });
      } else {
        alert("Failed to upload image");
      }
    } catch {
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const addKeyword = () => {
    const value = newKeyword.trim().toLowerCase();
    if (!value || seo.siteKeywords.includes(value)) return;
    setSeo({ ...seo, siteKeywords: [...seo.siteKeywords, value] });
    setNewKeyword("");
  };

  const removeKeyword = (index: number) => {
    setSeo({ ...seo, siteKeywords: seo.siteKeywords.filter((_, i) => i !== index) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Basic SEO */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Basic SEO</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Site Title</label>
            <input
              type="text"
              value={seo.siteTitle}
              onChange={(e) => setSeo({ ...seo, siteTitle: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="WeiChieh Photography"
            />
            <p className="text-xs text-stone-400 mt-1">Appears in browser tab and search results</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Site Description</label>
            <textarea
              value={seo.siteDescription}
              onChange={(e) => setSeo({ ...seo, siteDescription: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
              placeholder="A photography blog capturing moments and stories..."
            />
            <p className="text-xs text-stone-400 mt-1">Recommended: 150-160 characters for search results</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Keywords</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="Add keyword..."
              />
              <button
                onClick={addKeyword}
                className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {seo.siteKeywords.map((keyword, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
                >
                  {keyword}
                  <button onClick={() => removeKeyword(i)} className="text-stone-400 hover:text-stone-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Open Graph */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Social Sharing (Open Graph)</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Default Share Image</label>
            <div className="flex items-start gap-4">
              <div className="relative w-48 h-24 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                {seo.ogImage ? (
                  <Image src={seo.ogImage} alt="OG Image" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-stone-400" />
                  </div>
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 cursor-pointer transition-colors">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOgImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-xs text-stone-400 mt-2">Recommended: 1200x630px for best display</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Twitter Handle</label>
            <input
              type="text"
              value={seo.twitterHandle}
              onChange={(e) => setSeo({ ...seo, twitterHandle: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="@username"
            />
          </div>
        </div>
      </div>

      {/* Analytics & Tracking */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900 mb-4">Analytics & Tracking</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Google Analytics ID</label>
            <input
              type="text"
              value={seo.googleAnalyticsId}
              onChange={(e) => setSeo({ ...seo, googleAnalyticsId: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="G-XXXXXXXXXX"
            />
            <p className="text-xs text-stone-400 mt-1">Google Analytics 4 Measurement ID</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Google Search Console</label>
            <input
              type="text"
              value={seo.googleSearchConsoleId}
              onChange={(e) => setSeo({ ...seo, googleSearchConsoleId: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="Verification code or meta tag content"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Facebook Pixel ID</label>
            <input
              type="text"
              value={seo.facebookPixelId}
              onChange={(e) => setSeo({ ...seo, facebookPixelId: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="123456789012345"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save SEO Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Photos Section
// ============================================
interface PhotosSectionProps {
  activeTab: PhotoTab;
}

function PhotosSection({ activeTab }: PhotosSectionProps) {
  // Show category or tag manager based on tab
  if (activeTab === "categories") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 mb-6">Photo Categories</h1>
        <PhotoCategoriesManager />
      </div>
    );
  }

  if (activeTab === "tags") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 mb-6">Photo Tags</h1>
        <PhotoTagsManager />
      </div>
    );
  }

  // Default: Photo list
  return <PhotoListContent />;
}

function PhotoListContent() {
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

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

  useEffect(() => {
    fetchPhotos();
    fetchTags();
    fetchCategories();
  }, [fetchPhotos, fetchTags, fetchCategories]);

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

  // Bulk selection handlers
  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  };

  const handleBulkStatusChange = async (status: "draft" | "scheduled" | "published") => {
    if (selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      const promises = Array.from(selectedIds).map((id) => {
        const photo = photos.find((p) => p.id === id);
        if (!photo) return Promise.resolve();
        return fetch(`/api/photos/${photo.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      });
      await Promise.all(promises);
      fetchPhotos();
      setSelectedIds(new Set());
    } catch {
      alert("Failed to update photos");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`確定要刪除 ${selectedIds.size} 張照片嗎？此操作無法復原。`)) return;
    setIsBulkUpdating(true);
    try {
      const promises = Array.from(selectedIds).map((id) => {
        const photo = photos.find((p) => p.id === id);
        if (!photo) return Promise.resolve();
        return fetch(`/api/photos/${photo.slug}`, { method: "DELETE" });
      });
      await Promise.all(promises);
      fetchPhotos();
      setSelectedIds(new Set());
    } catch {
      alert("Failed to delete photos");
    } finally {
      setIsBulkUpdating(false);
    }
  };

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
      {selectedIds.size > 0 && (
        <div className="bg-stone-900 text-white rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm">{selectedIds.size} selected</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-stone-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value as "draft" | "scheduled" | "published");
                  e.target.value = "";
                }
              }}
              disabled={isBulkUpdating}
              className="px-3 py-1.5 bg-stone-800 border border-stone-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            >
              <option value="">Change Status...</option>
              <option value="draft">Set as Draft</option>
              <option value="published">Publish</option>
            </select>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkUpdating}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm disabled:opacity-50 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

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
                      checked={selectedIds.size === photos.length && photos.length > 0}
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
                  <tr key={photo.id} className={`hover:bg-stone-50 ${selectedIds.has(photo.id) ? "bg-stone-50" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(photo.id)}
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
        (completed) => {
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
    } catch {
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
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ArticleOption {
  id: number;
  slug: string;
  title: string;
}

function PhotoModal({ photo, tags, categories, onClose, onSuccess }: PhotoModalProps) {
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
  const [localTags, setLocalTags] = useState<PhotoTag[]>(tags);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // 合併資料庫分類和預設分類
  const allCategories = categories.length > 0
    ? categories.map((c) => c.name)
    : ["Portrait", "Landscape", "Street", "Nature"];

  const [formData, setFormData] = useState({
    title: photo?.title || "",
    slug: photo?.slug || "",
    category: photo?.category || allCategories[0],
    location: photo?.location || "",
    latitude: photo?.latitude ?? null as number | null,
    longitude: photo?.longitude ?? null as number | null,
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
        setLocalTags([...localTags, newTag]);
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
          const existingTag = localTags.find(
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
                setLocalTags((prev) => [...prev, newTag]);
                aiTagIds.push(newTag.id);
              }
            } catch {
              console.error("Failed to create tag:", tagName);
            }
          }
        }
      }

      // 更新表單（包含所有 AI 回傳的欄位）
      // 使用 functional update 避免閉包過時問題
      const aiTitle = data.title || "";
      const aiSlug = data.slug || "";

      // 生成 slug：優先使用 AI slug，否則從 title 生成
      let generatedSlug = "";
      if (aiSlug) {
        generatedSlug = aiSlug + "-" + Date.now();
      } else if (aiTitle) {
        // 從 title 生成 slug
        generatedSlug = aiTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim() + "-" + Date.now();
      }

      // 處理日期：如果 AI 有回傳日期則使用，否則使用今天
      const aiDate = data.date || new Date().toISOString().split("T")[0];

      setFormData((prev) => {
        // 判斷是否可以更新 slug：
        // 1. 新增模式 (isEditMode = false)
        // 2. 或者是剛 batch upload 的照片 (story 是預設值 "待編輯...")
        const isNewOrDraft = !isEditMode || prev.story === "待編輯..." || prev.story === "";
        const finalSlug = (isNewOrDraft && generatedSlug) ? generatedSlug : prev.slug;

        return {
          ...prev,
          title: aiTitle || prev.title,
          slug: finalSlug,
          story: data.story || prev.story,
          category: data.category || prev.category,
          tagIds: aiTagIds.length > 0 ? aiTagIds : prev.tagIds,
          // 新增欄位：只有 AI 回傳有效值時才覆蓋
          location: data.location || prev.location,
          date: aiDate,
          camera: data.camera || prev.camera,
          lens: data.lens || prev.lens,
        };
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
        latitude: formData.latitude,
        longitude: formData.longitude,
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

          {/* AI Auto-fill Section - At the very top */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-stone-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI 智慧填寫
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  上傳圖片後點擊「開始分析」，自動填寫所有欄位
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={isGeneratingStory || (!imagePreview && !formData.image)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isGeneratingStory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    開始分析
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="可選：輸入額外提示（如：這是在東京拍的、使用 Sony A7IV 等）"
              className="w-full px-3 py-2 border border-purple-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
          </div>

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
                {isEditMode && formData.story !== "待編輯..." && formData.story !== "" && (
                  <span className="text-xs text-stone-400 ml-2">(編輯模式下無法修改)</span>
                )}
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500"
                required
                disabled={isEditMode && formData.story !== "待編輯..." && formData.story !== ""}
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
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
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

          {/* Map Coordinates */}
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-stone-700 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Map Coordinates
                <span className="text-xs text-stone-400 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.location) return;
                    try {
                      const res = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}&limit=1`,
                        { headers: { "User-Agent": "WeiChieh-Photography-Blog" } }
                      );
                      const data = await res.json();
                      if (data[0]) {
                        setFormData({
                          ...formData,
                          latitude: parseFloat(data[0].lat),
                          longitude: parseFloat(data[0].lon),
                        });
                      }
                    } catch (err) {
                      console.error("Geocode error:", err);
                    }
                  }}
                  className="px-2 py-1 bg-white text-stone-600 rounded border border-stone-300 hover:bg-stone-100 text-xs flex items-center gap-1"
                  title="Search coordinates from location name"
                >
                  <Search className="w-3 h-3" />
                  從地名查詢
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="px-2 py-1 bg-stone-700 text-white rounded hover:bg-stone-800 text-xs flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  開啟地圖選點
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="any"
                placeholder="Latitude (e.g. 25.033)"
                value={formData.latitude ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    latitude: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude (e.g. 121.565)"
                value={formData.longitude ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    longitude: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white"
              />
            </div>
            {formData.latitude && formData.longitude && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Photo will appear on the map page
              </p>
            )}
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

          {/* Tags - Searchable */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Tag className="w-3 h-3 inline mr-1" />
              Tags
            </label>

            {/* Selected Tags */}
            {formData.tagIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-2 bg-blue-50 rounded-lg">
                {formData.tagIds.map((tagId) => {
                  const tag = localTags.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-full"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className="hover:bg-blue-600 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search/Add Input */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="搜尋或新增標籤..."
                    className="w-full pl-10 pr-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        // 如果有精確匹配的標籤，選中它；否則新增
                        const exactMatch = localTags.find(
                          (t) => t.name.toLowerCase() === newTagName.toLowerCase()
                        );
                        if (exactMatch) {
                          if (!formData.tagIds.includes(exactMatch.id)) {
                            handleTagToggle(exactMatch.id);
                          }
                          setNewTagName("");
                        } else if (newTagName.trim()) {
                          handleAddTag();
                        }
                      }
                    }}
                  />
                </div>
                {newTagName.trim() && !localTags.some(
                  (t) => t.name.toLowerCase() === newTagName.toLowerCase()
                ) && (
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    新增
                  </button>
                )}
              </div>

              {/* Filtered Tags Dropdown */}
              {newTagName && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {localTags
                    .filter((tag) =>
                      tag.name.toLowerCase().includes(newTagName.toLowerCase()) &&
                      !formData.tagIds.includes(tag.id)
                    )
                    .slice(0, 10)
                    .map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          handleTagToggle(tag.id);
                          setNewTagName("");
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-stone-100 flex items-center justify-between"
                      >
                        <span>{tag.name}</span>
                        <Plus className="w-4 h-4 text-stone-400" />
                      </button>
                    ))}
                  {localTags.filter((tag) =>
                    tag.name.toLowerCase().includes(newTagName.toLowerCase()) &&
                    !formData.tagIds.includes(tag.id)
                  ).length === 0 && newTagName.trim() && (
                    <div className="px-3 py-2 text-sm text-stone-500">
                      按 Enter 新增「{newTagName}」
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* All Available Tags (collapsed by default, show when no search) */}
            {!newTagName && localTags.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-700">
                  瀏覽所有標籤 ({localTags.length})
                </summary>
                <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-stone-50 rounded-lg max-h-32 overflow-y-auto">
                  {localTags
                    .filter((tag) => !formData.tagIds.includes(tag.id))
                    .map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className="px-2 py-0.5 text-xs bg-white border border-stone-200 text-stone-600 rounded hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {tag.name}
                      </button>
                    ))}
                </div>
              </details>
            )}
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
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Story *
            </label>
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

      {/* Map Picker Modal */}
      {showMapPicker && (
        <MapPickerModal
          latitude={formData.latitude}
          longitude={formData.longitude}
          onSelect={(lat, lng) => {
            setFormData({ ...formData, latitude: lat, longitude: lng });
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}

// ============================================
// Articles Section
// ============================================
interface ArticlesSectionProps {
  activeTab: ArticleTab;
}

function ArticlesSection({ activeTab }: ArticlesSectionProps) {
  // Show category or tag manager based on tab
  if (activeTab === "categories") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 mb-6">Article Categories</h1>
        <ArticleCategoriesManager />
      </div>
    );
  }

  if (activeTab === "tags") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 mb-6">Article Tags</h1>
        <ArticleTagsManager />
      </div>
    );
  }

  // Default: Article list
  return <ArticleListContent />;
}

function ArticleListContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<ArticleTag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [tagFilter, setTagFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

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

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/articles/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch categories");
    }
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchTags();
    fetchCategories();
  }, [fetchArticles, fetchTags, fetchCategories]);

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

  // 合併資料庫分類和預設分類
  const allCategories = categories.length > 0
    ? ["全部", ...categories.map((c) => c.name)]
    : ["全部", "技巧分享", "旅行日記", "攝影思考"];

  // Bulk selection handlers
  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(articles.map((a) => a.id)));
    }
  };

  const handleBulkStatusChange = async (status: "draft" | "scheduled" | "published") => {
    if (selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      const promises = Array.from(selectedIds).map((id) => {
        const article = articles.find((a) => a.id === id);
        if (!article) return Promise.resolve();
        return fetch(`/api/articles/${article.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      });
      await Promise.all(promises);
      fetchArticles();
      setSelectedIds(new Set());
    } catch {
      alert("Failed to update articles");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`確定要刪除 ${selectedIds.size} 篇文章嗎？此操作無法復原。`)) return;
    setIsBulkUpdating(true);
    try {
      const promises = Array.from(selectedIds).map((id) => {
        const article = articles.find((a) => a.id === id);
        if (!article) return Promise.resolve();
        return fetch(`/api/articles/${article.slug}`, { method: "DELETE" });
      });
      await Promise.all(promises);
      fetchArticles();
      setSelectedIds(new Set());
    } catch {
      alert("Failed to delete articles");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Articles</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Article
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search articles..."
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
      {selectedIds.size > 0 && (
        <div className="bg-stone-900 text-white rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm">{selectedIds.size} selected</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-stone-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value as "draft" | "scheduled" | "published");
                  e.target.value = "";
                }
              }}
              disabled={isBulkUpdating}
              className="px-3 py-1.5 bg-stone-800 border border-stone-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            >
              <option value="">Change Status...</option>
              <option value="draft">Set as Draft</option>
              <option value="published">Publish</option>
            </select>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkUpdating}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm disabled:opacity-50 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

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
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === articles.length && articles.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                    />
                  </th>
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
                  <tr key={article.id} className={`hover:bg-stone-50 ${selectedIds.has(article.id) ? "bg-stone-50" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(article.id)}
                        onChange={() => toggleSelect(article.id)}
                        className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                      />
                    </td>
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
          categories={categories}
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
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

function ArticleModal({ article, tags, categories, onClose, onSuccess }: ArticleModalProps) {
  const { upload, isUploading, progress } = useUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    article?.cover || null
  );
  const [newTagName, setNewTagName] = useState("");
  const [localTags, setLocalTags] = useState<ArticleTag[]>(tags);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const contentTextareaRef = { current: null as HTMLTextAreaElement | null };

  // 合併資料庫分類和預設分類
  const allCategories = categories.length > 0
    ? categories.map((c) => c.name)
    : ["技巧分享", "旅行日記", "攝影思考"];

  const [formData, setFormData] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    category: article?.category || allCategories[0],
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
        setLocalTags([...localTags, newTag]);
        setFormData({ ...formData, tagIds: [...formData.tagIds, newTag.id] });
        setNewTagName("");
      }
    } catch {
      console.error("Failed to add tag");
    }
  };

  // AI 生成文章
  const handleGenerateArticle = async () => {
    const imageUrl = coverPreview?.startsWith("data:") ? null : coverPreview;
    if (!imageUrl && !formData.cover) {
      setError("請先上傳封面圖片才能使用 AI 生成");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 如果是新上傳的圖片，需要先上傳
      let uploadedUrl = imageUrl;
      if (formData.cover && !imageUrl) {
        const { publicUrl } = await upload(formData.cover, "articles");
        uploadedUrl = publicUrl;
        setCoverPreview(publicUrl);
      }

      const res = await fetch("/api/ai/generate-article", {
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

      // 處理 AI 建議的 tags
      const aiTagIds: number[] = [];
      if (data.tags && Array.isArray(data.tags)) {
        for (const tagName of data.tags) {
          const existingTag = localTags.find(
            (t) => t.name.toLowerCase() === tagName.toLowerCase()
          );
          if (existingTag) {
            aiTagIds.push(existingTag.id);
          } else {
            try {
              const tagRes = await fetch("/api/articles/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: tagName }),
              });
              if (tagRes.ok) {
                const newTag = await tagRes.json();
                setLocalTags((prev) => [...prev, newTag]);
                aiTagIds.push(newTag.id);
              }
            } catch {
              console.error("Failed to create tag:", tagName);
            }
          }
        }
      }

      // 生成 slug
      const aiTitle = data.title || "";
      const aiSlug = data.slug || "";
      let generatedSlug = "";
      if (aiSlug) {
        generatedSlug = aiSlug + "-" + Date.now();
      } else if (aiTitle) {
        generatedSlug = aiTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim() + "-" + Date.now();
      }

      setFormData((prev) => {
        const isNewOrDraft = !isEditMode || prev.content === "" || prev.excerpt === "";
        const finalSlug = (isNewOrDraft && generatedSlug) ? generatedSlug : prev.slug;

        return {
          ...prev,
          title: aiTitle || prev.title,
          slug: finalSlug,
          excerpt: data.excerpt || prev.excerpt,
          content: data.content || prev.content,
          category: data.category || prev.category,
          tagIds: aiTagIds.length > 0 ? aiTagIds : prev.tagIds,
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 生成失敗");
    } finally {
      setIsGenerating(false);
    }
  };

  // 插入圖片到文章內容
  const handleInsertImage = async (file: File) => {
    if (!file) return;

    setIsUploadingImage(true);
    setError(null);

    try {
      const { publicUrl } = await upload(file, "articles");

      // 生成圖片的 alt 文字（使用檔名）
      const altText = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      // 插入 Markdown 圖片語法
      const imageMarkdown = `\n\n![${altText}](${publicUrl})\n\n`;

      // 在游標位置插入，或者在末尾追加
      const textarea = contentTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          formData.content.substring(0, start) +
          imageMarkdown +
          formData.content.substring(end);
        setFormData({ ...formData, content: newContent });

        // 設定游標位置到圖片後面
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
        }, 0);
      } else {
        // 如果沒有 textarea ref，直接追加到末尾
        setFormData({ ...formData, content: formData.content + imageMarkdown });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "圖片上傳失敗");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 插入 Markdown 格式
  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const newContent =
      formData.content.substring(0, start) +
      before + selectedText + after +
      formData.content.substring(end);

    setFormData({ ...formData, content: newContent });

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + selectedText.length;
      } else {
        textarea.selectionStart = textarea.selectionEnd = start + before.length;
      }
    }, 0);
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

          {/* AI Auto-fill Section */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-stone-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI 智慧生成
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  上傳封面圖後，自動生成標題、摘要、分類、Tags 和完整文章
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateArticle}
                disabled={isGenerating || (!coverPreview && !formData.cover)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    開始生成
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="可選：輸入額外提示（如：這是一篇關於黃金時刻攝影技巧的文章、偏向教學風格等）"
              className="w-full px-3 py-2 border border-purple-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
          </div>

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
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tags - Searchable */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Tag className="w-3 h-3 inline mr-1" />
              Tags
            </label>

            {/* Selected Tags */}
            {formData.tagIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-2 bg-blue-50 rounded-lg">
                {formData.tagIds.map((tagId) => {
                  const tag = localTags.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-full"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className="hover:bg-blue-600 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search/Add Input */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="搜尋或新增標籤..."
                    className="w-full pl-10 pr-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const exactMatch = localTags.find(
                          (t) => t.name.toLowerCase() === newTagName.toLowerCase()
                        );
                        if (exactMatch) {
                          if (!formData.tagIds.includes(exactMatch.id)) {
                            handleTagToggle(exactMatch.id);
                          }
                          setNewTagName("");
                        } else if (newTagName.trim()) {
                          handleAddTag();
                        }
                      }
                    }}
                  />
                </div>
                {newTagName.trim() && !localTags.some(
                  (t) => t.name.toLowerCase() === newTagName.toLowerCase()
                ) && (
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    新增
                  </button>
                )}
              </div>

              {/* Filtered Tags Dropdown */}
              {newTagName && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {localTags
                    .filter((tag) =>
                      tag.name.toLowerCase().includes(newTagName.toLowerCase()) &&
                      !formData.tagIds.includes(tag.id)
                    )
                    .slice(0, 10)
                    .map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          handleTagToggle(tag.id);
                          setNewTagName("");
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-stone-100 flex items-center justify-between"
                      >
                        <span>{tag.name}</span>
                        <Plus className="w-4 h-4 text-stone-400" />
                      </button>
                    ))}
                  {localTags.filter((tag) =>
                    tag.name.toLowerCase().includes(newTagName.toLowerCase()) &&
                    !formData.tagIds.includes(tag.id)
                  ).length === 0 && newTagName.trim() && (
                    <div className="px-3 py-2 text-sm text-stone-500">
                      按 Enter 新增「{newTagName}」
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* All Available Tags */}
            {!newTagName && localTags.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-700">
                  瀏覽所有標籤 ({localTags.length})
                </summary>
                <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-stone-50 rounded-lg max-h-32 overflow-y-auto">
                  {localTags
                    .filter((tag) => !formData.tagIds.includes(tag.id))
                    .map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className="px-2 py-0.5 text-xs bg-white border border-stone-200 text-stone-600 rounded hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {tag.name}
                      </button>
                    ))}
                </div>
              </details>
            )}
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

          {/* Content with Markdown Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-stone-700">
                Content (Markdown) *
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full transition-colors ${
                  showPreview
                    ? "bg-blue-500 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <Eye className="w-3 h-3" />
                {showPreview ? "隱藏預覽" : "顯示預覽"}
              </button>
            </div>

            {/* Editor Toolbar */}
            <div className="flex items-center gap-1 mb-2 p-2 bg-stone-50 rounded-t-md border border-b-0 border-stone-300">
              <button
                type="button"
                onClick={() => insertMarkdown("## ", "")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs font-bold"
                title="標題"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("### ", "")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs font-bold"
                title="小標題"
              >
                H3
              </button>
              <div className="w-px h-4 bg-stone-300 mx-1" />
              <button
                type="button"
                onClick={() => insertMarkdown("**", "**")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs font-bold"
                title="粗體"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("*", "*")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs italic"
                title="斜體"
              >
                I
              </button>
              <div className="w-px h-4 bg-stone-300 mx-1" />
              <button
                type="button"
                onClick={() => insertMarkdown("- ", "")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs"
                title="列表"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("> ", "")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs"
                title="引用"
              >
                &ldquo; Quote
              </button>
              <div className="w-px h-4 bg-stone-300 mx-1" />
              <button
                type="button"
                onClick={() => insertMarkdown("[", "](url)")}
                className="p-1.5 text-stone-600 hover:bg-stone-200 rounded text-xs"
                title="連結"
              >
                🔗 Link
              </button>
              <div className="w-px h-4 bg-stone-300 mx-1" />
              {/* Image Upload */}
              <label
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                  isUploadingImage
                    ? "bg-stone-300 text-stone-500"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                title="插入圖片"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    上傳中...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3 h-3" />
                    插入圖片
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleInsertImage(file);
                    e.target.value = "";
                  }}
                  className="hidden"
                  disabled={isUploadingImage}
                />
              </label>
            </div>

            <div className={`grid gap-4 ${showPreview ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {/* Editor */}
              <div>
                <textarea
                  ref={(el) => { contentTextareaRef.current = el; }}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={showPreview ? 20 : 10}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md rounded-t-none focus:outline-none focus:ring-2 focus:ring-stone-500 font-mono text-sm resize-none"
                  placeholder="## 標題&#10;&#10;在這裡撰寫文章內容...&#10;&#10;### 小標題&#10;&#10;- 列表項目 1&#10;- 列表項目 2&#10;&#10;> 引用文字"
                  required
                />
              </div>
              {/* Preview */}
              {showPreview && (
                <div className="border border-stone-200 rounded-md p-4 bg-white overflow-y-auto max-h-[480px]">
                  <div className="prose prose-stone prose-sm max-w-none markdown-preview">
                    {formData.content ? (
                      <MarkdownContent content={formData.content} />
                    ) : (
                      <p className="text-stone-400 italic">預覽會顯示在這裡...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
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
