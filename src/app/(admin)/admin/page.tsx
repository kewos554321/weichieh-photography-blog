"use client";

import Link from "next/link";
import { useState } from "react";

type Tab = "photos" | "articles";

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
          <Link href="/" className="text-sm text-stone-400 hover:text-white transition-colors">
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
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "Portrait",
    location: "",
    date: "",
    story: "",
    image: null as File | null,
  });

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormData({ ...formData, title, slug });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to backend API
    console.log("Photo data:", formData);
    alert("Photo saved! (Backend not connected yet)");
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Form */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-6">Add New Photo</h2>
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
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Story
            </label>
            <textarea
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="Tell the story behind this photo..."
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors"
          >
            Save Photo
          </button>
        </form>
      </div>

      {/* Info */}
      <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
        <h2 className="text-lg font-semibold mb-4">Notes</h2>
        <div className="text-sm text-stone-600 space-y-3">
          <p>
            <strong>Backend Required:</strong> This admin panel is a frontend prototype.
            To make it functional, you need to connect it to a backend service.
          </p>
          <p>Recommended options:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Supabase (PostgreSQL + Storage)</li>
            <li>Firebase (Firestore + Storage)</li>
            <li>Contentful / Sanity (Headless CMS)</li>
            <li>Custom API with Prisma + S3</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ArticlesTab() {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "技巧分享",
    excerpt: "",
    content: "",
    cover: null as File | null,
  });

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormData({ ...formData, title, slug });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to backend API
    console.log("Article data:", formData);
    alert("Article saved! (Backend not connected yet)");
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Form */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-6">Add New Article</h2>
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
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, cover: e.target.files?.[0] || null })}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 font-mono text-sm"
              placeholder="## Heading&#10;&#10;Your article content here..."
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors"
          >
            Save Article
          </button>
        </form>
      </div>

      {/* Info */}
      <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
        <h2 className="text-lg font-semibold mb-4">Markdown Guide</h2>
        <div className="text-sm text-stone-600 space-y-2 font-mono bg-stone-50 p-4 rounded">
          <p>## Heading 2</p>
          <p>### Heading 3</p>
          <p>**bold text**</p>
          <p>*italic text*</p>
          <p>- bullet point</p>
          <p>1. numbered list</p>
        </div>
      </div>
    </div>
  );
}
