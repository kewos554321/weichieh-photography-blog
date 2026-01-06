"use client";

import { Search, FolderOpen, Tag, X } from "lucide-react";
import { ViewModeToggle, ViewMode, GridSize } from "../shared/ViewModeToggle";

interface AlbumCategory {
  id: number;
  name: string;
  slug: string;
  _count?: { albums: number };
}

interface AlbumTag {
  id: number;
  name: string;
  _count?: { albums: number };
}

interface AlbumFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedTag: string;
  onTagChange: (value: string) => void;
  categories: AlbumCategory[];
  tags: AlbumTag[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  gridSize: GridSize;
  onGridSizeChange: (size: GridSize) => void;
}

export function AlbumFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  categories,
  tags,
  viewMode,
  onViewModeChange,
  gridSize,
  onGridSizeChange,
}: AlbumFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search albums..."
          className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 w-64 bg-white"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="relative">
        <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="pl-10 pr-8 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 appearance-none bg-white"
        >
          <option value="">All Categories</option>
          <option value="none">Uncategorized</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id.toString()}>
              {category.name} ({category._count?.albums || 0})
            </option>
          ))}
        </select>
      </div>

      {/* Tag Filter */}
      <div className="relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <select
          value={selectedTag}
          onChange={(e) => onTagChange(e.target.value)}
          className="pl-10 pr-8 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 appearance-none bg-white"
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id.toString()}>
              {tag.name} ({tag._count?.albums || 0})
            </option>
          ))}
        </select>
      </div>

      {/* View Mode Toggle */}
      <div className="ml-auto">
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          gridSize={gridSize}
          onGridSizeChange={onGridSizeChange}
          showGridSize={true}
        />
      </div>
    </div>
  );
}
