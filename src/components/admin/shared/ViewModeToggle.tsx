"use client";

import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "grid" | "list";
export type GridSize = "small" | "medium" | "large";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  gridSize?: GridSize;
  onGridSizeChange?: (size: GridSize) => void;
  showGridSize?: boolean;
}

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
  gridSize = "medium",
  onGridSizeChange,
  showGridSize = true,
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden">
      <button
        onClick={() => onViewModeChange("grid")}
        className={`p-2 transition-colors ${
          viewMode === "grid"
            ? "bg-stone-900 text-white"
            : "bg-white text-stone-500 hover:text-stone-700"
        }`}
        title="Grid view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange("list")}
        className={`p-2 transition-colors ${
          viewMode === "list"
            ? "bg-stone-900 text-white"
            : "bg-white text-stone-500 hover:text-stone-700"
        }`}
        title="List view"
      >
        <List className="w-4 h-4" />
      </button>

      {/* Grid Size Toggle (only visible in grid mode) */}
      {viewMode === "grid" && showGridSize && onGridSizeChange && (
        <>
          <div className="w-px h-6 bg-stone-200" />
          {(["small", "medium", "large"] as GridSize[]).map((size) => (
            <button
              key={size}
              onClick={() => onGridSizeChange(size)}
              className={`px-2.5 py-2 text-xs font-medium transition-colors ${
                gridSize === size
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-500 hover:text-stone-700"
              }`}
              title={size === "small" ? "Small" : size === "medium" ? "Medium" : "Large"}
            >
              {size === "small" ? "S" : size === "medium" ? "M" : "L"}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

// Grid class mappings for consistent grid layouts
export const GRID_CLASSES: Record<GridSize, string> = {
  small: "grid-cols-3 md:grid-cols-5 lg:grid-cols-6",
  medium: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  large: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
};
