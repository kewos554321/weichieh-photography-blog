"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle,
} from "lucide-react";
import type { PhotoTag, ArticleTag } from "./types";

interface TagManagerProps {
  title: string;
  apiPath: string;
  countField: string;
}

export function TagManager({ title, apiPath, countField }: TagManagerProps) {
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
