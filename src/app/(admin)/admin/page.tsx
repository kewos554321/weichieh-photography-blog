"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useUpload } from "@/hooks/useUpload";

type Tab = "photos" | "articles";

interface Photo {
  id: number;
  slug: string;
  title: string;
  src: string;
  category: string;
  location: string;
  date: string;
}

interface Article {
  id: number;
  slug: string;
  title: string;
  cover: string;
  category: string;
  date: string;
  published: boolean;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("photos");

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-stone-900 text-white">
        <nav className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-serif text-xl">
              WeiChieh
            </Link>
            <span className="text-stone-500">|</span>
            <span className="text-sm text-stone-400">Admin</span>
          </div>
          <Link
            href="/"
            className="text-sm text-stone-400 hover:text-white transition-colors"
          >
            ← Back to Site
          </Link>
        </nav>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("photos")}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "photos"
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setActiveTab("articles")}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "articles"
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              Articles
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {activeTab === "photos" ? <PhotosTab /> : <ArticlesTab />}
      </main>
    </div>
  );
}

function PhotosTab() {
  const { upload, isUploading, progress, error: uploadError } = useUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "Portrait",
    location: "",
    date: "",
    camera: "",
    lens: "",
    story: "",
    behindTheScene: "",
    image: null as File | null,
  });

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch("/api/photos?limit=10");
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch {
      console.error("Failed to fetch photos");
    } finally {
      setIsLoadingPhotos(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormData({ ...formData, title, slug });
  };

  const handleImageChange = (file: File | null) => {
    setFormData({ ...formData, image: file });
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      if (!formData.image) {
        throw new Error("Please select an image");
      }

      // 1. 上傳圖片到 R2
      const { publicUrl } = await upload(formData.image, "photos");

      // 2. 建立 Photo 記錄
      const response = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: formData.slug,
          title: formData.title,
          src: publicUrl,
          category: formData.category,
          location: formData.location,
          date: formData.date,
          camera: formData.camera || null,
          lens: formData.lens || null,
          story: formData.story,
          behindTheScene: formData.behindTheScene || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create photo");
      }

      setSubmitSuccess(true);
      setFormData({
        title: "",
        slug: "",
        category: "Portrait",
        location: "",
        date: "",
        camera: "",
        lens: "",
        story: "",
        behindTheScene: "",
        image: null,
      });
      setImagePreview(null);
      fetchPhotos();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("確定要刪除這張照片嗎？")) return;

    try {
      await fetch(`/api/photos/${slug}`, { method: "DELETE" });
      setPhotos(photos.filter((p) => p.slug !== slug));
    } catch {
      alert("刪除失敗");
    }
  };

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Add New Photo</h2>

          {submitSuccess && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
              Photo uploaded successfully!
            </div>
          )}

          {(submitError || uploadError) && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {submitError || uploadError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="e.g. Silent Gaze"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Slug (auto-generated)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="silent-gaze"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Category
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
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                  placeholder="e.g. Taipei"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Date
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Camera (optional)
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
                  Lens (optional)
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

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageChange(e.target.files?.[0] || null)
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                required
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

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Story
              </label>
              <textarea
                value={formData.story}
                onChange={(e) =>
                  setFormData({ ...formData, story: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="Tell the story behind this photo..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Behind The Scene (optional)
              </label>
              <textarea
                value={formData.behindTheScene}
                onChange={(e) =>
                  setFormData({ ...formData, behindTheScene: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="How was this photo taken..."
              />
            </div>

            {isUploading && (
              <div className="w-full bg-stone-200 rounded-full h-2">
                <div
                  className="bg-stone-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full py-3 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors disabled:bg-stone-400 disabled:cursor-not-allowed"
            >
              {isSubmitting || isUploading ? "Uploading..." : "Save Photo"}
            </button>
          </form>
        </div>

        {/* Recent Photos */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recent Photos</h2>
          {isLoadingPhotos ? (
            <div className="text-stone-500 text-sm">Loading...</div>
          ) : photos.length === 0 ? (
            <div className="text-stone-500 text-sm">No photos yet</div>
          ) : (
            <div className="space-y-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="flex items-center gap-3 p-2 border border-stone-200 rounded-md"
                >
                  <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={photo.src}
                      alt={photo.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {photo.title}
                    </div>
                    <div className="text-xs text-stone-500">
                      {photo.category} · {photo.location}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(photo.slug)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticlesTab() {
  const { upload, isUploading, progress, error: uploadError } = useUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "技巧分享",
    excerpt: "",
    content: "",
    cover: null as File | null,
    published: false,
  });

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/articles?limit=10");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch {
      console.error("Failed to fetch articles");
    } finally {
      setIsLoadingArticles(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormData({ ...formData, title, slug });
  };

  const handleCoverChange = (file: File | null) => {
    setFormData({ ...formData, cover: file });
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCoverPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setCoverPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      if (!formData.cover) {
        throw new Error("Please select a cover image");
      }

      // 1. 上傳封面到 R2
      const { publicUrl } = await upload(formData.cover, "articles");

      // 2. 建立 Article 記錄
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: formData.slug,
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          cover: publicUrl,
          category: formData.category,
          published: formData.published,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create article");
      }

      setSubmitSuccess(true);
      setFormData({
        title: "",
        slug: "",
        category: "技巧分享",
        excerpt: "",
        content: "",
        cover: null,
        published: false,
      });
      setCoverPreview(null);
      fetchArticles();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("確定要刪除這篇文章嗎？")) return;

    try {
      await fetch(`/api/articles/${slug}`, { method: "DELETE" });
      setArticles(articles.filter((a) => a.slug !== slug));
    } catch {
      alert("刪除失敗");
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Add New Article</h2>

          {submitSuccess && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
              Article created successfully!
            </div>
          )}

          {(submitError || uploadError) && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {submitError || uploadError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="e.g. 山岳攝影的十個心得"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Slug (auto-generated)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="mountain-photography-tips"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Category
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

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Cover Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleCoverChange(e.target.files?.[0] || null)
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                required
              />
              {coverPreview && (
                <div className="mt-2 relative aspect-video w-full max-w-xs overflow-hidden rounded-md">
                  <Image
                    src={coverPreview}
                    alt="Cover Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
                placeholder="Brief description for the article list..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Content (Markdown supported)
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={10}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 font-mono text-sm"
                placeholder="## Heading&#10;&#10;Your article content here..."
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) =>
                  setFormData({ ...formData, published: e.target.checked })
                }
                className="rounded border-stone-300"
              />
              <label htmlFor="published" className="text-sm text-stone-700">
                Publish immediately
              </label>
            </div>

            {isUploading && (
              <div className="w-full bg-stone-200 rounded-full h-2">
                <div
                  className="bg-stone-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full py-3 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors disabled:bg-stone-400 disabled:cursor-not-allowed"
            >
              {isSubmitting || isUploading ? "Uploading..." : "Save Article"}
            </button>
          </form>
        </div>

        {/* Recent Articles */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recent Articles</h2>
          {isLoadingArticles ? (
            <div className="text-stone-500 text-sm">Loading...</div>
          ) : articles.length === 0 ? (
            <div className="text-stone-500 text-sm">No articles yet</div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center gap-3 p-2 border border-stone-200 rounded-md"
                >
                  <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={article.cover}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {article.title}
                    </div>
                    <div className="text-xs text-stone-500">
                      {article.category} ·{" "}
                      {article.published ? "Published" : "Draft"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(article.slug)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Markdown Guide */}
          <div className="mt-6 pt-6 border-t border-stone-200">
            <h3 className="text-sm font-semibold mb-3">Markdown Guide</h3>
            <div className="text-xs text-stone-600 space-y-1 font-mono bg-stone-50 p-3 rounded">
              <p>## Heading 2</p>
              <p>### Heading 3</p>
              <p>**bold text**</p>
              <p>*italic text*</p>
              <p>- bullet point</p>
              <p>1. numbered list</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
