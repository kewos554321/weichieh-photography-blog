"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import type { Article, ArticleTag, Category } from "../types";
import { ArticleModal } from "./ArticleModal";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionBar, BulkAction } from "../common/BulkActionBar";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";

export function ArticleListContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<ArticleTag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [tagFilter, setTagFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

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
    items: articles,
    getItemId: (article) => article.id,
  });

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

  // Bulk action handlers
  const handleBulkStatusChange = async (status: string) => {
    if (selectedCount === 0) return;
    setIsBulkUpdating(true);
    try {
      const promises = articles
        .filter((a) => isSelected(a.id))
        .map((article) =>
          fetch(`/api/articles/${article.slug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
        );
      await Promise.all(promises);
      fetchArticles();
      clearSelection();
    } catch {
      alert("Failed to update articles");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;
    if (!confirm(`確定要刪除 ${selectedCount} 篇文章嗎？此操作無法復原。`)) return;
    setIsBulkUpdating(true);
    try {
      const promises = articles
        .filter((a) => isSelected(a.id))
        .map((article) =>
          fetch(`/api/articles/${article.slug}`, { method: "DELETE" })
        );
      await Promise.all(promises);
      fetchArticles();
      clearSelection();
    } catch {
      alert("Failed to delete articles");
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
                      checked={isAllSelected}
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
                  <tr key={article.id} className={`hover:bg-stone-50 ${isSelected(article.id) ? "bg-stone-50" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected(article.id)}
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
