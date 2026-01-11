"use client";

import { useState } from "react";
import { Tag, Search, Plus, X } from "lucide-react";

export interface BaseTag {
  id: number;
  name: string;
}

interface TagSelectorProps<T extends BaseTag = BaseTag> {
  selectedTagIds: number[];
  availableTags: T[];
  onTagsChange: (tagIds: number[]) => void;
  createTagEndpoint: string;
  onTagCreated?: (newTag: T) => void;
  label?: string;
  placeholder?: string;
  allowCreate?: boolean;
  maxTags?: number;
  selectedBgColor?: string;
  selectedTextColor?: string;
  className?: string;
}

export function TagSelector<T extends BaseTag = BaseTag>({
  selectedTagIds,
  availableTags,
  onTagsChange,
  createTagEndpoint,
  onTagCreated,
  label = "Tags",
  placeholder = "搜尋或新增標籤...",
  allowCreate = true,
  maxTags,
  selectedBgColor = "bg-blue-500",
  selectedTextColor = "text-white",
  className = "",
}: TagSelectorProps<T>) {
  const [searchValue, setSearchValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleTagToggle = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      if (maxTags && selectedTagIds.length >= maxTags) {
        return; // 達到最大數量限制
      }
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleAddTag = async () => {
    if (!searchValue.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const res = await fetch(createTagEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchValue.trim() }),
      });

      if (res.ok) {
        const newTag = (await res.json()) as T;
        onTagCreated?.(newTag);
        onTagsChange([...selectedTagIds, newTag.id]);
        setSearchValue("");
      }
    } catch {
      console.error("Failed to add tag");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const exactMatch = availableTags.find(
        (t) => t.name.toLowerCase() === searchValue.toLowerCase()
      );
      if (exactMatch) {
        if (!selectedTagIds.includes(exactMatch.id)) {
          handleTagToggle(exactMatch.id);
        }
        setSearchValue("");
      } else if (searchValue.trim() && allowCreate) {
        handleAddTag();
      }
    }
  };

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchValue.toLowerCase()) &&
      !selectedTagIds.includes(tag.id)
  );

  const showCreateButton =
    allowCreate &&
    searchValue.trim() &&
    !availableTags.some(
      (t) => t.name.toLowerCase() === searchValue.toLowerCase()
    );

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-stone-700 mb-2">
          <Tag className="w-3 h-3 inline mr-1" />
          {label}
        </label>
      )}

      {/* Selected Tags */}
      {selectedTagIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 p-2 bg-blue-50 rounded-lg">
          {selectedTagIds.map((tagId) => {
            const tag = availableTags.find((t) => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tag.id}
                className={`inline-flex items-center gap-1 px-3 py-1 text-sm ${selectedBgColor} ${selectedTextColor} rounded-full`}
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
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full pl-10 pr-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>
          {showCreateButton && (
            <button
              type="button"
              onClick={handleAddTag}
              disabled={isCreating}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center gap-1 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              新增
            </button>
          )}
        </div>

        {/* Filtered Tags Dropdown */}
        {searchValue && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filteredTags.slice(0, 10).map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  handleTagToggle(tag.id);
                  setSearchValue("");
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-stone-100 flex items-center justify-between"
              >
                <span>{tag.name}</span>
                <Plus className="w-4 h-4 text-stone-400" />
              </button>
            ))}
            {filteredTags.length === 0 && searchValue.trim() && allowCreate && (
              <div className="px-3 py-2 text-sm text-stone-500">
                按 Enter 新增「{searchValue}」
              </div>
            )}
            {filteredTags.length === 0 && searchValue.trim() && !allowCreate && (
              <div className="px-3 py-2 text-sm text-stone-500">
                找不到符合的標籤
              </div>
            )}
          </div>
        )}
      </div>

      {/* All Available Tags (collapsed by default) */}
      {!searchValue && availableTags.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-700">
            瀏覽所有標籤 ({availableTags.length})
          </summary>
          <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-stone-50 rounded-lg max-h-32 overflow-y-auto">
            {availableTags
              .filter((tag) => !selectedTagIds.includes(tag.id))
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
  );
}
